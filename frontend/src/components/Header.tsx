import React from 'react';
import './Header.css';

const Header = () => (
  <header className="header">
    <div className="logo">MTurk Survey</div>
    <nav>
      <a href="/">Home</a>
      <a href="/auth">Login</a>
    </nav>
  </header>
);

export default Header;