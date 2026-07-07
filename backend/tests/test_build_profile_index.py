import os
import sys
import json
import pytest
from unittest.mock import patch, MagicMock
from dataclasses import asdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from build_profile_index import INDEX_PATH, build_index


class TestBuildIndex:
    """Test the build_index function."""

    @patch('build_profile_index.retrieval.embed_text')
    def test_build_index_embeds_every_chunk_and_preserves_fields(self, mock_embed_text):
        """Test that build_index embeds every chunk and preserves all fields."""
        # Mock embed_text to return a dummy embedding
        mock_embed_text.return_value = [0.1, 0.2, 0.3, 0.4, 0.5]

        # Sample profile text with two sections
        profile_text = """
## Section One
This is the first section of profile text.

## Section Two
This is the second section of profile text with more details.
"""

        # Call build_index with mock embedding function
        result = build_index(profile_text, embed_fn=mock_embed_text)

        # Verify result is a list of dicts
        assert isinstance(result, list)
        assert len(result) == 2
        assert all(isinstance(item, dict) for item in result)

        # Verify each dict has the expected fields
        for item in result:
            assert "chunk_id" in item
            assert "section_title" in item
            assert "text" in item
            assert "embedding" in item

        # Verify embeddings were set
        assert result[0]["embedding"] == [0.1, 0.2, 0.3, 0.4, 0.5]
        assert result[1]["embedding"] == [0.1, 0.2, 0.3, 0.4, 0.5]

        # Verify embed_text was called for each chunk
        assert mock_embed_text.call_count == 2

        # Verify embed_text was called with the chunk text
        calls = mock_embed_text.call_args_list
        assert calls[0][0][0] == "This is the first section of profile text."
        assert calls[1][0][0] == "This is the second section of profile text with more details."


class TestIndexPath:
    """Test INDEX_PATH constant."""

    def test_index_path_is_defined(self):
        """Test that INDEX_PATH is defined."""
        assert INDEX_PATH is not None
        assert isinstance(INDEX_PATH, str)
        assert INDEX_PATH.endswith("profile_index.json")
