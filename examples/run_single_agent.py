"""Example: run a single QA agent programmatically."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path so qa_ecosystem is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from qa_ecosystem.runner import run_single_agent
from qa_ecosystem.templates import fill_template


async def main():
    # Load the sample PBI
    pbi_path = Path(__file__).parent / "sample_pbi.md"
    pbi_content = pbi_path.read_text(encoding="utf-8")

    # Fill the default template for the test-case-generator
    prompt = fill_template(
        "test-case-generator",
        "default",
        pbi_content=pbi_content,
        focus_areas="MFA login flow, session locking, recovery codes",
        priority="High",
        requirement_id="PBI-1042",
    )

    # Run the agent
    result = await run_single_agent(
        agent_name="test-case-generator",
        prompt=prompt,
    )
    print("\n--- Agent Result ---")
    print(result)


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
