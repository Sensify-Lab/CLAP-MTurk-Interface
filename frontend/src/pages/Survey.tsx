import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { SongData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSearchParams, Navigate } from 'react-router-dom';
import './Survey.css';

const FEATURE_DESCRIPTIONS: { [key: string]: string } = {
  "Stimulating": "A lively, energetic track with strong rhythm and upbeat tempo to boost movement and attention.",
  "Playful": "A whimsical, bouncy track with light percussion and bright tones to encourage joyful exploration.",
  "Soothing": "A calm, gentle track with soft melodies and slow tempo for relaxation and emotional regulation.",
  "Sensory-Calming": "A track with ambient textures and minimal melodic content designed to reduce sensory overload.",
  "Grounding": "A steady, repetitive musical base that promotes sensory stability and emotional anchoring.",
  "Focusing": "A structured, predictable track with consistent rhythm to support sustained attention and task engagement.",
  "Transitional": "A cue-based musical track used to signal transitions between activities or routines.",
  "Anxiety-Reduction": "A soft, harmonically stable track specifically designed to ease agitation or anxious behaviors.",
};

const ALL_FEATURES = Object.keys(FEATURE_DESCRIPTIONS);
let lastAllowedTime = 0;

const Survey = () => {
  const [searchParams] = useSearchParams();
  const paramId = searchParams.get('id');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || paramId || '');
  const [song, setSong] = useState<SongData | null>(null);
  const [rankedFeatures, setRankedFeatures] = useState<string[]>(['', '', '']);
  const [description, setDescription] = useState('');
  const [gptRating, setGptRating] = useState('');
  const [audioEnded, setAudioEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [descriptions, setDescriptions] = useState({ gpt: '' });
  const [showFeatureInfo, setShowFeatureInfo] = useState(false);

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
      setDescriptions({ gpt: res.data.chatgpt_description });

      setRankedFeatures(['', '', '']);
      setDescription('');
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

    const unique = new Set(rankedFeatures);
    if (unique.size < 3) {
      alert('Each feature ranking must be unique.');
      return;
    }

    setShowDescriptions(true);
  };

  const handleSubmit = async () => {
    if (!gptRating) {
      alert('Please rate the description.');
      return;
    }

    const form = new FormData();
    form.append('user_id', userId);
    form.append('song_id', song.song_id);
    rankedFeatures.forEach((f, i) => form.append(`feature${i + 1}`, f));
    form.append('user_description', description.trim());
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
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;
            if (audio.currentTime > lastAllowedTime + 0.35) {
              audio.currentTime = lastAllowedTime;
            } else {
              lastAllowedTime = audio.currentTime;
            }
          }}
        />

        {!audioEnded && <p className="wait-msg">⏳ Please listen to the full song before continuing.</p>}

        {audioEnded && !showDescriptions && (
          <>
            <h3>Rank the Top 3 Most Relevant Features</h3>
            <button className="info-toggle" onClick={() => setShowFeatureInfo(!showFeatureInfo)}>
              {showFeatureInfo ? 'Hide Feature Descriptions' : 'Show Feature Descriptions'}
            </button>

            <div className={`feature-info-box ${showFeatureInfo ? 'open' : ''}`}>
              {ALL_FEATURES.map((f) => (
                <div key={f} className="feature-info">
                  <strong>{f}:</strong> {FEATURE_DESCRIPTIONS[f]}
                </div>
              ))}
            </div>

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
            <p>Give a 1-2 sentence description of the song based off of your selected features.</p>
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
              <h3>ChatGPT Description:</h3>
              <p className="description-text">{descriptions.gpt}</p>
              <div className="scale-input">
                <span>How much do you agree with it?</span>
                <div className="scale-row scale-centered">
  {[[-2, "Strongly Disagree"], [-1, "Disagree"], [0, "Neutral"], [1, "Agree"], [2, "Strongly Agree"]].map(([val, label]) => (
    <div key={`gpt-${val}`} className="scale-option">
      <div className="scale-label">{label}</div>
      <input
        type="radio"
        name="gpt"
        value={val}
        checked={gptRating === val.toString()}
        onChange={(e) => setGptRating(e.target.value)}
      />
    </div>
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