"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Candidate {
  id: string;
  displayName: string;
}

interface Question {
  id: string;
  text: string;
  description: string | null;
  sortOrder: number;
}

interface Poll {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface PollData {
  poll: Poll;
  questions: Question[];
  candidates: Candidate[];
}

export default function PublicPollPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [pollData, setPollData] = useState<PollData | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [voterId, setVoterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Load poll data
  useEffect(() => {
    async function loadPoll() {
      try {
        const res = await fetch(`/api/polls/${slug}`);
        if (!res.ok) {
          throw new Error("Poll not found");
        }
        const data = await res.json();
        setPollData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load poll");
      }
    }
    loadPoll();
  }, [slug]);

  // Get or create voter
  useEffect(() => {
    if (!pollData) return;

    const storageKey = `poll:${pollData.poll.id}:voterId`;
    const storedVoterId = localStorage.getItem(storageKey);

    if (storedVoterId) {
      setVoterId(storedVoterId);
    } else {
      // Create new voter
      fetch(`/api/polls/${slug}/ensure-voter`, { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem(storageKey, data.voterId);
          setVoterId(data.voterId);
        })
        .catch((err) => {
          console.error("Failed to create voter:", err);
          setError("Failed to initialize voter");
        });
    }
  }, [pollData, slug]);

  // Load existing votes
  useEffect(() => {
    if (!voterId || !pollData) return;

    fetch(`/api/polls/${slug}/my-votes?voterId=${voterId}`)
      .then((res) => res.json())
      .then((data) => {
        setVotes(data.votes || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load votes:", err);
        setLoading(false);
      });
  }, [voterId, pollData, slug]);

  // Save vote
  const saveVote = useCallback(
    async (questionId: string, candidateId: string) => {
      if (!voterId) return;

      setSaving(questionId);
      try {
        const res = await fetch(`/api/polls/${slug}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voterId, questionId, candidateId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save");
        }

        setVotes((prev) => ({ ...prev, [questionId]: candidateId }));
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);
      } catch (err) {
        console.error("Failed to save vote:", err);
        alert(err instanceof Error ? err.message : "Failed to save vote");
      } finally {
        setSaving(null);
      }
    },
    [voterId, slug]
  );

  // Handle candidate selection
  const handleSelect = (questionId: string, candidateId: string) => {
    saveVote(questionId, candidateId);
    setOpenDropdown(null);
    setSearchQuery((prev) => ({ ...prev, [questionId]: "" }));
  };

  // Filter candidates based on search
  const getFilteredCandidates = (questionId: string) => {
    const query = (searchQuery[questionId] || "").toLowerCase();
    if (!query) return pollData?.candidates || [];
    return (
      pollData?.candidates.filter((c) =>
        c.displayName.toLowerCase().includes(query)
      ) || []
    );
  };

  // Get candidate name by ID
  const getCandidateName = (candidateId: string) => {
    return pollData?.candidates.find((c) => c.id === candidateId)?.displayName || "";
  };

  // Count answered questions
  const answeredCount = Object.keys(votes).length;
  const totalQuestions = pollData?.questions.length || 0;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !pollData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  const isClosed = pollData.poll.status === "closed";

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {pollData.poll.title}
          </h1>
          {isClosed && (
            <div className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              Poll Closed
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-medium text-blue-600">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {pollData.questions.map((question, index) => (
            <div
              key={question.id}
              className="p-6 bg-white rounded-lg shadow-sm"
            >
              <label className="block text-lg font-medium text-gray-900 mb-1">
                {index + 1}. {question.text}
              </label>
              {question.description && (
                <p className="text-sm text-gray-500 mb-3">{question.description}</p>
              )}
              {!question.description && <div className="mb-3" />}

              {/* Searchable dropdown */}
              <div className="relative">
                <div
                  className={`border rounded-lg ${
                    openDropdown === question.id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300"
                  } ${isClosed ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() =>
                    !isClosed &&
                    setOpenDropdown(
                      openDropdown === question.id ? null : question.id
                    )
                  }
                >
                  {openDropdown === question.id ? (
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg focus:outline-none"
                      placeholder="Search names..."
                      value={searchQuery[question.id] || ""}
                      onChange={(e) =>
                        setSearchQuery((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span
                        className={
                          votes[question.id]
                            ? "text-gray-900"
                            : "text-gray-400"
                        }
                      >
                        {votes[question.id]
                          ? getCandidateName(votes[question.id])
                          : "Select a name..."}
                      </span>
                      {saving === question.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </div>

                {/* Dropdown list */}
                {openDropdown === question.id && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {getFilteredCandidates(question.id).length === 0 ? (
                      <div className="px-4 py-3 text-gray-500">
                        No matches found
                      </div>
                    ) : (
                      getFilteredCandidates(question.id).map((candidate) => (
                        <div
                          key={candidate.id}
                          className={`px-4 py-3 cursor-pointer hover:bg-blue-50 ${
                            votes[question.id] === candidate.id
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-900"
                          }`}
                          onClick={() =>
                            handleSelect(question.id, candidate.id)
                          }
                        >
                          {candidate.displayName}
                          {votes[question.id] === candidate.id && (
                            <span className="float-right text-blue-600">✓</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Your Answers Summary */}
        {answeredCount > 0 && (
          <div className="mt-8 p-6 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Answers
            </h2>
            <ul className="space-y-2">
              {pollData.questions.map((question) => (
                <li key={question.id} className="flex justify-between">
                  <span className="text-gray-600 truncate pr-4">
                    {question.text}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {votes[question.id]
                      ? getCandidateName(votes[question.id])
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Saved toast */}
        {savedToast && (
          <div className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Saved ✓
          </div>
        )}

        {/* Click outside to close dropdown */}
        {openDropdown && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setOpenDropdown(null)}
          />
        )}
      </div>
    </div>
  );
}
