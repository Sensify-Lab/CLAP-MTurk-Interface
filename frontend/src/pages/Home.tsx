import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => (
  <div className="home-container">
    <div className="home-box">
      <h1>MTurk Song Tag Survey</h1>
      <p>
        Welcome! In this task, you’ll rank emotion tags for music and compare AI-generated descriptions.
      </p>
      <Link to="/auth">
        <button>Start Now</button>
      </Link>
    </div>
  </div>
);

export default Home;