import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { SongData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Navigate } from 'react-router-dom';
import './Survey.css';

const Survey = () => {
  const userId = localStorage.getItem('userId');
  const [song, setSong] = useState<SongData | null>(null);
  const [ranking, setRanking] = useState<{ [key: string]: number }>({});
  const [chosenDesc, setChosenDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/next-song', {
        params: { user_id: userId },
      });
      if (res.data.complete) setComplete(true);
      else setSong(res.data);
      setRanking({});
      setChosenDesc('');
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
  if (complete) return <h2 className="survey-container">✅ Session Complete! Thank you.</h2>;
  if (!song) return null;

  const handleSubmit = async () => {
    const ranks = Object.values(ranking);
    if (ranks.length !== 3 || new Set(ranks).size !== 3 || !chosenDesc) {
      alert('Please complete all fields with unique rankings and a description choice.');
      return;
    }

    const form = new FormData();
    form.append('user_id', userId);
    form.append('song_id', song.song_id);
    form.append('rank1', Object.keys(ranking).find(k => ranking[k] === 1)!);
    form.append('rank2', Object.keys(ranking).find(k => ranking[k] === 2)!);
    form.append('rank3', Object.keys(ranking).find(k => ranking[k] === 3)!);
    form.append('chosen_desc', chosenDesc);

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

  const features = [song.top_feature_1, song.top_feature_2, song.top_feature_3];

  return (
    <div className="survey-container">
      <div className="survey-box">
        <h2>Now Playing</h2>
        <audio controls src={`http://localhost:8000/audio/${song.song_file}`} />

        <h3>Rank the Emotions (1 = Most Relevant, 3 = Least)</h3>
        {features.map((f) => (
          <div key={f} className="survey-field">
            <label>{f}</label>
            <select
              value={ranking[f] || ''}
              onChange={(e) =>
                setRanking((prev) => ({ ...prev, [f]: parseInt(e.target.value) }))
              }
            >
              <option value="">Select rank</option>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ))}

        <h3>Choose the Better Description</h3>
        <div className="desc-options">
          <label>
            <input
              type="radio"
              value="gpt"
              name="desc"
              onChange={() => setChosenDesc('gpt')}
              checked={chosenDesc === 'gpt'}
            />{' '}
            GPT: {song.gpt_desc}
          </label>
          <label>
            <input
              type="radio"
              value="gemini"
              name="desc"
              onChange={() => setChosenDesc('gemini')}
              checked={chosenDesc === 'gemini'}
            />{' '}
            Gemini: {song.gemini_desc}
          </label>
        </div>

        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default Survey;
