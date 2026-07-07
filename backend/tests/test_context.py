import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from context import prompt


def test_prompt_includes_given_profile_context():
    result = prompt(profile_context="Some retrieved section text.")
    assert "Some retrieved section text." in result


def test_prompt_does_not_reference_full_resume_dump():
    result = prompt(profile_context="Some retrieved section text.")
    assert "Resume not available" not in result
