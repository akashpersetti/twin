import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import server


def test_get_faq_returns_matching_entry():
    entry = server.get_faq(1)
    assert entry is not None
    assert entry["faq"] == 1
    assert "question" in entry
    assert "answer" in entry


def test_get_faq_returns_none_for_unknown_number():
    assert server.get_faq(999) is None


def test_match_faq_shortcut_matches_various_casing_and_whitespace():
    assert server.match_faq_shortcut("Q1")["faq"] == 1
    assert server.match_faq_shortcut("q1")["faq"] == 1
    assert server.match_faq_shortcut("  Q1  ")["faq"] == 1


def test_match_faq_shortcut_rejects_non_shortcut_text():
    assert server.match_faq_shortcut("Q1x") is None
    assert server.match_faq_shortcut("hello") is None
    assert server.match_faq_shortcut("Q") is None


def test_match_faq_shortcut_returns_none_for_unknown_number():
    assert server.match_faq_shortcut("Q999") is None


def test_match_faq_shortcut_returns_none_for_extremely_long_number():
    assert server.match_faq_shortcut("Q" + "9" * 5000) is None
