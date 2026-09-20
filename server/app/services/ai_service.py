import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, status
from google import genai
from google.genai import types

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

gemini_api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None


def generate_questions(
    category_name: str,
    difficulty: str = "medium",
    question_type: str = "written",
    num_questions: int = 5,
):
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not set",
        )

    if num_questions <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="num_questions must be greater than 0",
        )

    prompt = (
        f"Generate exactly {num_questions} interview questions for the category '{category_name}' "
        f"at a {difficulty} difficulty level for job interview practice.\n"
        f"Question type: {question_type}.\n"
        "Return ONLY a valid JSON array and nothing else. Do not include markdown, code fences, "
        "explanations, numbering, or extra text.\n\n"
        "Rules:\n"
        "- If question_type is \"written\", every item must be an object with keys: "
        '"type": "written" and "question" (string).\n'
        '- If question_type is "mcq", every item must be an object with keys: '
        '"type": "mcq", "question" (string), "options" (object with A-D string values), '
        'and "correct_answer" (one of "A", "B", "C", "D").\n'
        '- If question_type is "mixed", alternate between written and mcq questions, starting '
        "with a written question unless num_questions is 1.\n"
        '- For MCQ questions, provide exactly 4 options labeled A, B, C, and D, with one clearly '
        "correct answer indicated in correct_answer.\n"
        "- Keep questions appropriate for a real interview practice context.\n"
        "- Ensure the JSON is valid and contains exactly the requested number of items."
    )

    try:
        response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        questions = json.loads(response.text or "")

        if not isinstance(questions, list) or len(questions) != num_questions:
            raise ValueError(
                f"Response was not a JSON array of exactly {num_questions} questions"
            )

        return questions
    except HTTPException:
        raise
    except Exception as e:
        print(f"GEMINI ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview questions: {e}",
        ) from e


def evaluate_answers(qa_pairs: list):
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not set",
        )

    try:
        def is_mcq(pair):
            return (getattr(pair, "type", "written") or "written").lower() == "mcq"

        def normalize_mcq(pair):
            return {
                "question": pair.question,
                "answer": pair.answer,
                "options": getattr(pair, "options", None) or {},
                "correct_answer": (getattr(pair, "correct_answer", "") or "").upper(),
            }

        mcq_results = []
        written_pairs = []

        for pair in qa_pairs:
            if is_mcq(pair):
                mcq_payload = normalize_mcq(pair)
                correct_answer = (mcq_payload["correct_answer"] or "").upper()
                selected_answer = (pair.answer or "").strip().upper()
                options = mcq_payload["options"] or {}

                if selected_answer and selected_answer == correct_answer:
                    mcq_results.append(
                        {
                            "type": "mcq",
                            "question": pair.question,
                            "answer": pair.answer,
                            "options": options,
                            "correct_answer": correct_answer,
                            "score": 10,
                            "strengths": "Correct answer selected.",
                            "improvement": "",
                        }
                    )
                else:
                    correct_answer_text = options.get(correct_answer, "")
                    mcq_results.append(
                        {
                            "type": "mcq",
                            "question": pair.question,
                            "answer": pair.answer,
                            "options": options,
                            "correct_answer": correct_answer,
                            "score": 0,
                            "strengths": "None.",
                            "improvement": (
                                f"Incorrect. The correct answer was {correct_answer}: {correct_answer_text}."
                            ),
                        }
                    )
            else:
                written_pairs.append(
                    {
                        "question": pair.question,
                        "answer": pair.answer,
                    }
                )

        written_results = []

        if written_pairs:
            pairs_text = "\n".join(
                [
                    f"Question: {pair['question']}\nAnswer: {pair['answer']}"
                    for pair in written_pairs
                ]
            )

            prompt = (
                "Evaluate the following interview question and answer pairs together.\n"
                "For each question-answer pair, provide a score out of 10, a short strengths comment, "
                "and a short improvement suggestion.\n"
                "Return ONLY a valid JSON array and nothing else.\n"
                "Each item in the array must be an object with these keys: "
                '"type" (always "written"), "question" (string), "answer" (string), '
                '"score" (number 0-10), "strengths" (string), "improvement" (string).\n\n'
                f"Interview data:\n{pairs_text}"
            )

            response = client.models.generate_content(
                model="gemini-flash-lite-latest",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )

            written_results = json.loads(response.text or "")

            if not isinstance(written_results, list):
                raise ValueError("Response was not a JSON array")

            if len(written_results) != len(written_pairs):
                raise ValueError("Response was not a JSON array of the expected length")

        combined_results = []
        written_index = 0
        mcq_index = 0

        for pair in qa_pairs:
            if is_mcq(pair):
                if mcq_index >= len(mcq_results):
                    raise ValueError("Missing MCQ answer evaluation")

                combined_results.append(mcq_results[mcq_index])
                mcq_index += 1
            else:
                if written_index >= len(written_results):
                    raise ValueError("Missing written answer evaluation")

                written_item = written_results[written_index]
                written_index += 1

                if not isinstance(written_item, dict):
                    raise ValueError("Written answer evaluation must be an object")

                combined_results.append(
                    {
                        "type": "written",
                        "question": written_item.get("question", pair.question),
                        "answer": written_item.get("answer", pair.answer),
                        "score": written_item.get("score", 0),
                        "strengths": written_item.get("strengths", ""),
                        "improvement": written_item.get("improvement", ""),
                    }
                )

        score_summary = [
            {
                "type": item.get("type", "written"),
                "score": item.get("score", 0),
                "question": item.get("question", ""),
            }
            for item in combined_results
        ]

        summary_prompt = (
            "Write a concise 2-3 sentence overall assessment of the candidate based on the "
            "following interview results. Consider the distribution of scores and the mix of "
            "question types.\n"
            "Return ONLY a JSON object with a single key: \"overall_summary\".\n\n"
            f"Results summary:\n{json.dumps(score_summary)}"
        )

        summary_response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=summary_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        summary_payload = json.loads(summary_response.text or "")
        overall_summary = ""

        if isinstance(summary_payload, dict):
            overall_summary = summary_payload.get("overall_summary", "")

        if not overall_summary:
            raise ValueError("Missing overall summary from Gemini")

        return combined_results + [{"overall_summary": overall_summary}]
    except HTTPException:
        raise
    except Exception as e:
        print(f"GEMINI ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate interview answers: {e}",
        ) from e
