"""Example: run the Test Manager orchestrator programmatically."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path so qa_ecosystem is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from qa_ecosystem.runner import run_orchestrator


async def main():
    # Load the sample PBI
    pbi_path = Path(__file__).parent / "sample_pbi.md"
    pbi_content = pbi_path.read_text(encoding="utf-8")

    prompt = f"""\
Orchestrate a complete test cycle for this PBI:

{pbi_content}

Please:
1. Analyze requirements for ambiguities
2. Generate comprehensive test cases
3. Define expected results (test oracles)
4. Design synthetic test data
5. Produce a Test Plan document

Deliver a consolidated QA strategy with all outputs.
"""

    result = await run_orchestrator(prompt=prompt)
    print("\n--- Orchestrator Result ---")
    print(result)


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
