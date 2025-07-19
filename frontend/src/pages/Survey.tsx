import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { SongData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSearchParams, Navigate } from 'react-router-dom';
import './Survey.css';

const ALL_FEATURES = [
  "Soothing", "Stimulating", "Grounding", "Playful", "Focusing", "Transitional", "Interactive",
  "Motivating", "Anxiety-Reducing", "Task-Oriented", "Self Expressive", "Sensory-Calming",
  "Attention-Shifting", "Rhythmic Synchronizing", "Confidence-Building"
];

let lastAllowedTime = 0;

const Survey = () => {
  const [searchParams] = useSearchParams();
  const paramId = searchParams.get('id');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || paramId || '');
  const [song, setSong] = useState<SongData | null>(null);
  const [rankedFeatures, setRankedFeatures] = useState<string[]>(['', '', '']);
  const [description, setDescription] = useState('');
  const [geminiRating, setGeminiRating] = useState('');
  const [gptRating, setGptRating] = useState('');
  const [audioEnded, setAudioEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [descriptions, setDescriptions] = useState({ gemini: '', gpt: '' });

  useEffect(() => {
    if (paramId) {
      localStorage.setItem('userId', paramId);
      setUserId(paramId);
    }
  }, [paramId]);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setAudioEnded(false);
    setShowDescriptions(false);

    try {
      const res = await axios.get('http://localhost:8000/next-song', {
        params: { user_id: userId },
      });

      if (res.data.complete) {
        setComplete(true);
        return;
      }

      setSong(res.data);
      setDescriptions({
        gemini: res.data.gemini_description,
        gpt: res.data.chatgpt_description,
      });

      setRankedFeatures(['', '', '']);
      setDescription('');
      setGeminiRating('');
      setGptRating('');
      lastAllowedTime = 0;
    } catch (error) {
      alert('Error fetching song. Please try again.');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchNext();
  }, [fetchNext, userId]);

  if (!userId) return <Navigate to="/auth" replace />;
  if (loading) return <LoadingSpinner />;
  if (complete) return <h2 className="survey-container">✅ Session Complete! Thank you.</h2>;
  if (!song) return null;

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...rankedFeatures];
    updated[index] = value;
    setRankedFeatures(updated);
  };

  const handleNext = () => {
    if (rankedFeatures.includes('') || !description.trim()) {
      alert('Please rank all 3 features and enter a description.');
      return;
    }

    const uniqueFeatures = new Set(rankedFeatures);
    if (uniqueFeatures.size < 3) {
      alert('Each feature ranking must be unique.');
      return;
    }

    setShowDescriptions(true);
  };

  const handleSubmit = async () => {
    if (!geminiRating || !gptRating) {
      alert('Please rate both descriptions.');
      return;
    }

    const form = new FormData();
    form.append('user_id', userId);
    form.append('song_id', song.song_id);
    rankedFeatures.forEach((f, i) => form.append(`feature${i + 1}`, f));
    form.append('user_description', description.trim());
    form.append('gemini_rating', geminiRating);
    form.append('chatgpt_rating', gptRating);

    setSubmitting(true);
    try {
      await axios.post('http://localhost:8000/submit', form);
      fetchNext();
    } catch {
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survey-container">
      <div className="survey-box">
        <h2>Now Playing</h2>
        <audio
          controls
          src={`http://localhost:8000/audio/${song.song_file}`}
          onEnded={() => setAudioEnded(true)}
          controlsList="nodownload noplaybackrate"
          preload="auto"
          /*
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;
            if (audio.currentTime > lastAllowedTime + 0.35) {
              audio.currentTime = lastAllowedTime;
            } else {
              lastAllowedTime = audio.currentTime;
            }
          }}
            */
        />

        {!audioEnded && <p className="wait-msg">⏳ Please listen to the full song before continuing.</p>}

        {audioEnded && !showDescriptions && (
          <>
            <h3>Rank the Top 3 Most Relevant Features</h3>
            {[0, 1, 2].map((i) => (
              <div className="feature-row" key={i}>
                <label>Rank {i + 1}:</label>
                <select
                  value={rankedFeatures[i]}
                  onChange={(e) => handleFeatureChange(i, e.target.value)}
                >
                  <option value="">-- Select a feature --</option>
                  {ALL_FEATURES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            ))}

            <h3>Describe the Song</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write your own description here..."
              rows={4}
            />

            <button className="next-button" onClick={handleNext}>Next</button>
          </>
        )}

        {showDescriptions && (
          <>
            <div className="description-block">
              <h3>Gemini Description:</h3>
              <p className="description-text">{descriptions.gemini}</p>
              <div className="scale-input">
                <span>How much do you agree with it?</span>
                <div className="scale-row">
                  {[-2, -1, 0, 1, 2].map((num) => (
                    <label key={`gemini-${num}`}>
                      <input
                        type="radio"
                        name="gemini"
                        value={num}
                        checked={geminiRating === num.toString()}
                        onChange={(e) => setGeminiRating(e.target.value)}
                      />
                      {num}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="description-block">
              <h3>ChatGPT Description:</h3>
              <p className="description-text">{descriptions.gpt}</p>
              <div className="scale-input">
                <span>How much do you agree with it?</span>
                <div className="scale-row">
                  {[-2, -1, 0, 1, 2].map((num) => (
                    <label key={`gpt-${num}`}>
                      <input
                        type="radio"
                        name="gpt"
                        value={num}
                        checked={gptRating === num.toString()}
                        onChange={(e) => setGptRating(e.target.value)}
                      />
                      {num}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="button-row">
              <button
                className="back-button"
                onClick={() => setShowDescriptions(false)}
                disabled={submitting}
              >
                Back
              </button>
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Survey;
