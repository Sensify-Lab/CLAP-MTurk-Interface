import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { SongData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Navigate } from 'react-router-dom';
import './Survey.css';

const ALL_FEATURES = [
  "Soothing", "Stimulating", "Grounding", "Playful", "Focusing", "Transitional", "Interactive",
  "Motivating", "Anxiety-Reducing", "Task-Oriented", "Self Expressive", "Sensory-Calming",
  "Attention-Shifting", "Rhythmic Synchronizing", "Confidence-Building"
];

const Survey = () => {
  const userId = localStorage.getItem('userId');
  const [song, setSong] = useState<SongData | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [audioEnded, setAudioEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setAudioEnded(false);
    try {
      const res = await axios.get('http://localhost:8000/next-song', {
        params: { user_id: userId },
      });
      if (res.data.complete) setComplete(true);
      else setSong(res.data);
      setSelectedFeatures([]);
      setDescription('');
    } catch {
      alert('Error fetching song. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchNext();
  }, [fetchNext, userId]);

  if (!userId) return <Navigate to="/auth" replace />;
  if (loading) return <LoadingSpinner />;
  if (complete) return <h2 className="survey-container">Session Complete! Thank you.</h2>;
  if (!song) return null;

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : prev.length < 3
        ? [...prev, feature]
        : prev
    );
  };

  const handleSubmit = async () => {
    if (selectedFeatures.length !== 3 || !description.trim()) {
      alert('Please select exactly 3 features and enter a description.');
      return;
    }

    const form = new FormData();
    form.append('user_id', userId);
    form.append('song_id', song.song_id);
    selectedFeatures.forEach((f, i) => form.append(`feature${i + 1}`, f));
    form.append('description', description.trim());

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
        />

        {!audioEnded && <p className="wait-msg">Please listen to the full song before continuing.</p>}

        {audioEnded && (
          <>
            <h3>Select the 3 Most Relevant Features</h3>
            <div className="features-grid">
              {ALL_FEATURES.map((feature) => (
                <label key={feature} className={`feature-option ${selectedFeatures.includes(feature) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    disabled={!selectedFeatures.includes(feature) && selectedFeatures.length >= 3}
                  />
                  {feature}
                </label>
              ))}
            </div>

            <h3>Describe the Emotion</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write your own description here..."
              rows={4}
            />

            <button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Survey;