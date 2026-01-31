"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

interface Question {
  id: string;
  text: string;
  description: string | null;
  sortOrder: number;
}

interface Candidate {
  id: string;
  displayName: string;
}

interface Poll {
  id: string;
  title: string;
  slug: string;
  status: string;
  questions: Question[];
  candidates: Candidate[];
}

export default function EditPollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.pollId as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionDesc, setNewQuestionDesc] = useState("");
  const [newCandidate, setNewCandidate] = useState("");
  const [showQR, setShowQR] = useState(false);

  const fetchPoll = async () => {
    try {
      const res = await fetch(`/api/admin/polls/${pollId}`);
      if (res.status === 401) {
        router.push("/admin");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPoll(data.poll);
      setTitle(data.poll.title);
      setSlug(data.poll.slug);
      setStatus(data.poll.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to save");
      } else {
        fetchPoll();
      }
    } catch (err) {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      const res = await fetch(`/api/admin/polls/${pollId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newQuestion, description: newQuestionDesc || null }),
      });
      if (res.ok) {
        setNewQuestion("");
        setNewQuestionDesc("");
        fetchPoll();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add question");
      }
    } catch (err) {
      alert("Failed to add question");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;

    try {
      await fetch(
        `/api/admin/polls/${pollId}/questions?questionId=${questionId}`,
        { method: "DELETE" }
      );
      fetchPoll();
    } catch (err) {
      alert("Failed to delete question");
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.trim()) return;

    try {
      const res = await fetch(`/api/admin/polls/${pollId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: newCandidate }),
      });
      if (res.ok) {
        setNewCandidate("");
        fetchPoll();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add candidate");
      }
    } catch (err) {
      alert("Failed to add candidate");
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Delete this candidate?")) return;

    try {
      await fetch(
        `/api/admin/polls/${pollId}/candidates?candidateId=${candidateId}`,
        { method: "DELETE" }
      );
      fetchPoll();
    } catch (err) {
      alert("Failed to delete candidate");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this entire poll? This cannot be undone.")) return;

    try {
      await fetch(`/api/admin/polls/${pollId}`, { method: "DELETE" });
      router.push("/admin/polls");
    } catch (err) {
      alert("Failed to delete poll");
    }
  };

  const pollUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${slug}`
      : `/p/${slug}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Poll not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/admin/polls"
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to polls
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
          >
            Delete Poll
          </button>
        </div>

        {/* Poll Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Poll Settings</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">QR Code</h2>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showQR ? "Hide" : "Show"} QR Code
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Public URL:{" "}
            <a
              href={pollUrl}
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              {pollUrl}
            </a>
          </p>
          {showQR && (
            <div className="flex justify-center p-4 bg-white border rounded-lg">
              <QRCodeSVG value={pollUrl} size={200} />
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Questions</h2>
          {poll.questions.length === 0 ? (
            <p className="text-gray-500 mb-4">No questions yet</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {poll.questions.map((q, i) => (
                <li
                  key={q.id}
                  className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">
                      {i + 1}. {q.text}
                    </span>
                    {q.description && (
                      <p className="text-sm text-gray-500 mt-1">{q.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-red-600 hover:text-red-700 text-sm ml-4"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAddQuestion} className="space-y-3">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Question title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <textarea
              value={newQuestionDesc}
              onChange={(e) => setNewQuestionDesc(e.target.value)}
              placeholder="Description (optional) - explain what this question is about..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={2}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Question
            </button>
          </form>
        </div>

        {/* Candidates (Attendee Names) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Candidates (Attendee Names)</h2>
          {poll.candidates.length === 0 ? (
            <p className="text-gray-500 mb-4">No candidates yet</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {poll.candidates.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span>{c.displayName}</span>
                  <button
                    onClick={() => handleDeleteCandidate(c.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAddCandidate} className="flex gap-2">
            <input
              type="text"
              value={newCandidate}
              onChange={(e) => setNewCandidate(e.target.value)}
              placeholder="Add a name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
