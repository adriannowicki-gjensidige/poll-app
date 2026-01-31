import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET /api/admin/polls/[pollId]/results - Get voting results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pollId } = await params;

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        questions: { orderBy: { sortOrder: "asc" } },
        candidates: { orderBy: { displayName: "asc" } },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Get total voters
    const totalVoters = await prisma.voter.count({
      where: { pollId },
    });

    // Get vote counts grouped by question and candidate
    const voteCounts = await prisma.vote.groupBy({
      by: ["questionId", "candidateId"],
      where: { pollId },
      _count: { id: true },
    });

    // Build results structure
    const results: Record<string, Record<string, number>> = {};
    for (const question of poll.questions) {
      results[question.id] = {};
      for (const candidate of poll.candidates) {
        results[question.id][candidate.id] = 0;
      }
    }

    // Fill in actual counts
    for (const vc of voteCounts) {
      if (results[vc.questionId]) {
        results[vc.questionId][vc.candidateId] = vc._count.id;
      }
    }

    return NextResponse.json({
      poll: {
        id: poll.id,
        title: poll.title,
        status: poll.status,
      },
      questions: poll.questions,
      candidates: poll.candidates,
      results,
      totalVoters,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
