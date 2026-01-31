import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/polls/[slug]/vote
// Upserts a vote for the given voter and question
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const { voterId, questionId, candidateId } = body;

    if (!voterId || !questionId || !candidateId) {
      return NextResponse.json(
        { error: "voterId, questionId, and candidateId are required" },
        { status: 400 }
      );
    }

    const poll = await prisma.poll.findUnique({
      where: { slug: params.slug },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.status === "closed") {
      return NextResponse.json(
        { error: "Poll is closed" },
        { status: 403 }
      );
    }

    // Verify voter belongs to this poll
    const voter = await prisma.voter.findFirst({
      where: { id: voterId, pollId: poll.id },
    });

    if (!voter) {
      return NextResponse.json(
        { error: "Invalid voter" },
        { status: 403 }
      );
    }

    // Verify question and candidate belong to this poll
    const question = await prisma.question.findFirst({
      where: { id: questionId, pollId: poll.id },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Invalid question" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, pollId: poll.id },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Invalid candidate" },
        { status: 400 }
      );
    }

    // Upsert the vote
    const vote = await prisma.vote.upsert({
      where: {
        pollId_questionId_voterId: {
          pollId: poll.id,
          questionId,
          voterId,
        },
      },
      update: {
        candidateId,
      },
      create: {
        pollId: poll.id,
        questionId,
        voterId,
        candidateId,
      },
    });

    return NextResponse.json({ success: true, vote });
  } catch (error) {
    console.error("Error saving vote:", error);
    return NextResponse.json(
      { error: "Failed to save vote" },
      { status: 500 }
    );
  }
}
