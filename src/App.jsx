import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainHub from './components/MainHub';
import ToeicApp from './components/ToeicApp';
import GamesHub from './components/GamesHub';
import VoiceInvaders from './components/VoiceInvaders';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainHub />} />
      <Route path="/toeic" element={<ToeicApp />} />
      <Route path="/games" element={<GamesHub />} />
      <Route path="/games/voice-invaders" element={<VoiceInvaders />} />
    </Routes>
  );
}

export default App;
