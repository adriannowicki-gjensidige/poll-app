import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// GET /api/admin/polls/[pollId] - Get poll details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  if (!isAuthenticated()) {
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

    return NextResponse.json({ poll });
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/polls/[pollId] - Update poll
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pollId } = await params;

  try {
    const body = await request.json();
    const { title, slug, status } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.poll.findFirst({
        where: { slug, NOT: { id: pollId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ poll });
  } catch (error) {
    console.error("Error updating poll:", error);
    return NextResponse.json(
      { error: "Failed to update poll" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/polls/[pollId] - Delete poll
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pollId } = await params;

  try {
    await prisma.poll.delete({ where: { id: pollId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return NextResponse.json(
      { error: "Failed to delete poll" },
      { status: 500 }
    );
  }
}
