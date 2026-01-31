import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// POST /api/admin/polls/[pollId]/candidates - Add candidate
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { displayName } = body;

    if (!displayName) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await prisma.candidate.findFirst({
      where: { pollId: params.pollId, displayName },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Candidate name already exists in this poll" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.create({
      data: {
        pollId: params.pollId,
        displayName,
      },
    });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Error creating candidate:", error);
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/polls/[pollId]/candidates - Delete candidate
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      );
    }

    await prisma.candidate.delete({ where: { id: candidateId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  }
}
