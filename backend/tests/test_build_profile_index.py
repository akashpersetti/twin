import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import build_profile_index
import retrieval


def test_build_index_embeds_every_chunk_and_preserves_fields():
    sample_text = "# Title\n\n## Section One\nBody one.\n\n## Section Two\nBody two.\n"

    with patch.object(retrieval, "embed_text", side_effect=lambda t: [len(t) * 1.0]):
        result = build_profile_index.build_index(sample_text)

    assert len(result) == 2
    assert result[0]["chunk_id"] == "section-one"
    assert result[0]["section_title"] == "Section One"
    assert result[0]["text"] == "Body one."
    assert result[0]["embedding"] == [len("Body one.") * 1.0]
    assert result[1]["chunk_id"] == "section-two"
