import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [board, setBoard] = useState(Array(9).fill(" "));
  const [winner, setWinner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });
  const [showGuide, setShowGuide] = useState(true);
  const [thinkingProcess, setThinkingProcess] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('game');
  const [difficulty, setDifficulty] = useState('hard');
  const [animation, setAnimation] = useState('');
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [showComplexity, setShowComplexity] = useState(false);

  const API_BASE_URL = 'http://localhost:5000';

  const makeMove = async (index) => {
    if (board[index] !== " " || winner || isLoading) return;

    setIsLoading(true);
    setError(null);
    setThinkingProcess(["L'IA réfléchit à son prochain coup..."]);
    try {
      const response = await fetch(`${API_BASE_URL}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move: index, difficulty }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur serveur');
      }

      const data = await response.json();
      setBoard(data.board);
      setWinner(data.winner || null);
      
      // Mettre à jour les scores
      if (data.winner === 'X') {
        setScores(prev => ({ ...prev, player: prev.player + 1 }));
        setAnimation('player-win');
      } else if (data.winner === 'O') {
        setScores(prev => ({ ...prev, ai: prev.ai + 1 }));
        setAnimation('ai-win');
      } else if (data.board.every(cell => cell !== " ")) {
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        setAnimation('draw');
      }

      // Simuler le processus de réflexion de l'IA
      simulateThinkingProcess();
      
      // Ajouter à l'historique
      if (data.winner || data.board.every(cell => cell !== " ")) {
        setGameHistory(prev => [{
          board: [...data.board],
          winner: data.winner || 'Draw',
          date: new Date().toLocaleString(),
          moves: prev.length > 0 ? prev[0].moves + 1 : 1
        }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
    setIsLoading(false);
  };

  const simulateThinkingProcess = () => {
    const processes = [
      "Évaluation des coups possibles...",
      "Calcul des scores pour chaque mouvement...",
      "Application de l'élagage alpha-bêta...",
      "Recherche du mouvement optimal...",
      "Détermination du meilleur coup..."
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < processes.length) {
        setThinkingProcess(prev => [...prev, processes[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setThinkingProcess([]);
        }, 2000);
      }
    }, 500);
  };

  const resetGame = async () => {
    setIsLoading(true);
    setError(null);
    setThinkingProcess([]);
    setAnimation('');
    try {
      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation');
      }
      
      const data = await response.json();
      setBoard(data.board);
      setWinner(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    resetGame();
  }, []);

  useEffect(() => {
    if (animation) {
      const timer = setTimeout(() => setAnimation(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [animation]);

  const renderSquare = (index) => {
    const value = board[index] === " " ? "" : board[index];
    const isWinningSquare = winner && winner !== 'Draw' && 
      (board[index] === winner);
    
    return (
      <button
        className={`square ${value ? 'occupied' : ''} ${isWinningSquare ? 'winning' : ''}`}
        onClick={() => makeMove(index)}
        disabled={value || winner || isLoading}
      >
        {value === 'X' ? '❌' : value === 'O' ? '⭕' : ''}
      </button>
    );
  };

  const getStatusMessage = () => {
    if (error) return `Erreur: ${error}`;
    if (winner === 'X') return 'Vous avez gagné! 🎉';
    if (winner === 'O') return 'L\'IA a gagné! 🤖';
    if (winner === 'Draw') return 'Match nul! 🤝';
    if (board.every(square => square !== " ")) return 'Match nul! 🤝';
    return `Tour: ${isLoading ? 'IA réfléchit...' : 'Votre tour (❌)'}`;
  };

  const renderAlgorithmExplanation = () => (
    <div className="algorithm-explanation">
      <button 
        className="toggle-algorithm-btn"
        onClick={() => setShowAlgorithm(!showAlgorithm)}
      >
        {showAlgorithm ? 'Masquer les détails de l\'algorithme' : 'Afficher les détails de l\'algorithme'}
      </button>
      
      {showAlgorithm && (
        <div className="algorithm-details">
          <h3>Explication étape par étape de l'algorithme Min-Max</h3>
          
          <div className="algorithm-step">
            <h4>Le plateau</h4>
            <p>On utilise une liste de 9 cases.</p>
            <div className="code-block">
              <pre>'X' = MAX, 'O' = MIN, ' ' = case vide.</pre>
            </div>
          </div>
          
          <div className="algorithm-step">
            <h4>check_winner(board)</h4>
            <p>Vérifie toutes les lignes, colonnes et diagonales pour voir qui a gagné.</p>
            <div className="code-block">
              <pre>Retourne 'X' si MAX gagne, 'O' si MIN gagne, 'Tie' si match nul, None sinon.</pre>
            </div>
          </div>
          
          <div className="algorithm-step">
            <h4>minimax(board, is_max)</h4>
            <p>Cas de base : si quelqu'un a gagné ou si match nul, retourne le score.</p>
            <p>Si c'est le tour de MAX (is_max=True) :</p>
            <ul>
              <li>Essaie chaque coup possible.</li>
              <li>Appelle minimax pour le tour de MIN.</li>
              <li>Garde le score maximum (MAX veut gagner).</li>
            </ul>
            <p>Si c'est le tour de MIN (is_max=False) :</p>
            <ul>
              <li>Essaie chaque coup possible.</li>
              <li>Appelle minimax pour le tour de MAX.</li>
              <li>Garde le score minimum (MIN veut empêcher MAX de gagner).</li>
            </ul>
          </div>
          
          <div className="algorithm-step">
            <h4>best_move(board)</h4>
            <p>Parcourt toutes les cases vides.</p>
            <p>Utilise minimax pour calculer le score de chaque coup.</p>
            <p>Retourne la meilleure case pour MAX.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderComplexityExplanation = () => (
    <div className="complexity-explanation">
      <button 
        className="toggle-complexity-btn"
        onClick={() => setShowComplexity(!showComplexity)}
      >
        {showComplexity ? 'Masquer les détails de complexité' : 'Afficher les détails de complexité'}
      </button>
      
      {showComplexity && (
        <div className="complexity-details">
          <h3>📊 Complexité Algorithmique de Min-Max</h3>
          
          <div className="complexity-section">
            <h4>🟢 Arbre Min-Max (schéma simplifié)</h4>
            <div className="tree-diagram">
              <pre>{`
                  [MAX]
                /   |   \\
              b=3  b=3  b=3      <-- niveau 0 (racine, depth=0)
             /|\\   /|\\   /|\\
          [MIN][MIN][MIN] ...     <-- niveau 1 (depth=1)
           /|\\   /|\\   /|\\
         b=3  b=3 ...              <-- niveau 2 (depth=2)
        ...
              `}</pre>
            </div>
            
            <div className="complexity-legend">
              <h5>Légende :</h5>
              <ul>
                <li><strong>Nœud</strong> = état du jeu (plateau)</li>
                <li><strong>MAX</strong> = joueur qui veut maximiser le score</li>
                <li><strong>MIN</strong> = joueur qui veut minimiser le score</li>
                <li><strong>b</strong> = branching factor → nombre de coups possibles par nœud</li>
                <li><strong>d</strong> = profondeur de l'arbre → nombre de tours jusqu'à la fin du jeu</li>
              </ul>
            </div>
          </div>
          
          <div className="complexity-section">
            <h4>🔹 Explication liée aux complexités</h4>
            
            <div className="complexity-formula">
              <h5>Time Complexity = O(b<sup>d</sup>)</h5>
              <p>Chaque nœud a b enfants → arbre complet de profondeur d = b<sup>d</sup> positions possibles.</p>
            </div>
            
            <div className="complexity-formula">
              <h5>Space Complexity = O(d)</h5>
              <p>Avec récursion, on ne stocke que le chemin actuel de la racine jusqu'à la feuille → profondeur = d.</p>
            </div>
            
            <div className="complexity-example">
              <h5>Exemple pour le Morpion :</h5>
              <ul>
                <li>Profondeur maximale (d) = 9 coups</li>
                <li>Branching factor (b) ≈ 4-5 en moyenne (diminue avec le jeu)</li>
                <li>Complexité temporelle ≈ O(5<sup>9</sup>) ≈ 2 millions d'états</li>
                <li>Avec élagage alpha-bêta : réduction significative à ≈ 1000-5000 états</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMinMaxExplanation = () => (
    <div className="explanation">
      <h2>🧠 Algorithme Min-Max avec Élagage Alpha-Bêta</h2>
      
      <div className="algorithm-steps">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>Exploration de l'arbre de jeu</h3>
            <p>L'algorithme explore tous les coups possibles jusqu'à une certaine profondeur ou jusqu'à la fin du jeu.</p>
          </div>
        </div>
        
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>Évaluation des positions</h3>
            <p>Chaque position finale est évaluée : +1 pour une victoire de l'IA, -1 pour une défaite, 0 pour un match nul.</p>
          </div>
        </div>
        
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>Propagation des valeurs</h3>
            <p>Les valeurs remontent l'arbre : l'IA maximise son score (Max), le joueur minimise le score de l'IA (Min).</p>
          </div>
        </div>
        
        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>Élagage Alpha-Bêta</h3>
            <p>Les branches inutiles sont élaguées pour optimiser le processus sans affecter le résultat final.</p>
          </div>
        </div>
        
        <div className="step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h3>Sélection du meilleur coup</h3>
            <p>L'IA choisit le coup qui mène à la position avec le score le plus élevé après l'évaluation complète.</p>
          </div>
        </div>
      </div>
      
      {renderAlgorithmExplanation()}
      {renderComplexityExplanation()}

      <div className="strategy-tips">
        <h3>💡 Stratégies Gagnantes</h3>
        <ul>
          <li>Commencez au centre pour maximiser vos options</li>
          <li>Essayez de créer deux menaces simultanées</li>
          <li>Bloquez les lignes de l'adversaire dès que possible</li>
          <li>Contrôlez les coins pour une meilleure position</li>
        </ul>
      </div>
    </div>
  );

  const renderGameHistory = () => (
    <div className="history-section">
      <h2>📜 Historique des Parties</h2>
      {gameHistory.length === 0 ? (
        <p className="no-history">Aucune partie enregistrée</p>
      ) : (
        <div className="history-list">
          {gameHistory.map((game, index) => (
            <div key={index} className="history-item">
              <div className="history-header">
                <span className="history-date">{game.date}</span>
                <span className={`history-result ${game.winner === 'X' ? 'win' : game.winner === 'O' ? 'loss' : 'draw'}`}>
                  {game.winner === 'X' ? 'Victoire' : game.winner === 'O' ? 'Défaite' : 'Match nul'}
                </span>
              </div>
              <div className="mini-board">
                {game.board.map((cell, idx) => (
                  <div key={idx} className="mini-cell">
                    {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderThinkingProcess = () => (
    <div className="thinking-process">
      <h3>🤔 Processus de Réflexion de l'IA</h3>
      {thinkingProcess.length > 0 ? (
        <div className="process-list">
          {thinkingProcess.map((process, index) => (
            <div key={index} className="process-item">
              <div className="process-dot"></div>
              <span>{process}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-process">L'IA n'est pas en train de réfléchir pour le moment</p>
      )}
    </div>
  );

  return (
    <div className={`app ${animation}`}>
      <header className="app-header">
        <h1>🎮 Morpion IA - Algorithme Min-Max</h1>
        <p>Affrontez une intelligence artificielle utilisant l'algorithme Min-Max avec élagage Alpha-Bêta</p>
      </header>

      <div className="main-container">
        <nav className="tabs">
          <button 
            className={activeTab === 'game' ? 'active' : ''} 
            onClick={() => setActiveTab('game')}
          >
            🎯 Jeu
          </button>
          <button 
            className={activeTab === 'explanation' ? 'active' : ''} 
            onClick={() => setActiveTab('explanation')}
          >
            📚 Explications
          </button>
          <button 
            className={activeTab === 'history' ? 'active' : ''} 
            onClick={() => setActiveTab('history')}
          >
            📜 Historique
          </button>
        </nav>

        <div className="tab-content">
          {activeTab === 'game' && (
            <div className="game-container">
              <div className="game-board-section">
                <div className="status">{getStatusMessage()}</div>
                
                <div className="controls">
                  <div className="difficulty-selector">
                    <label>Difficulté:</label>
                    <select 
                      value={difficulty} 
                      onChange={(e) => setDifficulty(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="easy">Facile</option>
                      <option value="medium">Moyen</option>
                      <option value="hard">Difficile</option>
                    </select>
                  </div>
                  
                  <button className="reset-btn" onClick={resetGame} disabled={isLoading}>
                    🔄 Nouvelle Partie
                  </button>
                </div>

                <div className="scores">
                  <div className="score-item player">
                    <span className="score-label">Vous (❌):</span>
                    <span className="score-value">{scores.player}</span>
                  </div>
                  <div className="score-item draws">
                    <span className="score-label">Matchs nuls:</span>
                    <span className="score-value">{scores.draws}</span>
                  </div>
                  <div className="score-item ai">
                    <span className="score-label">IA (⭕):</span>
                    <span className="score-value">{scores.ai}</span>
                  </div>
                </div>

                <div className="board">
                  <div className="board-row">
                    {renderSquare(0)}
                    {renderSquare(1)}
                    {renderSquare(2)}
                  </div>
                  <div className="board-row">
                    {renderSquare(3)}
                    {renderSquare(4)}
                    {renderSquare(5)}
                  </div>
                  <div className="board-row">
                    {renderSquare(6)}
                    {renderSquare(7)}
                    {renderSquare(8)}
                  </div>
                </div>

                {renderThinkingProcess()}
              </div>

              {showGuide && (
                <div className="game-guide">
                  <h3>📖 Guide de Jeu</h3>
                  <ul>
                    <li>Vous jouez avec les ❌ (X)</li>
                    <li>L'IA joue avec les ⭕ (O)</li>
                    <li>Cliquez sur une case vide pour placer votre symbole</li>
                    <li>Le premier à aligner 3 symboles gagne</li>
                    <li>Si toutes les cases sont remplies sans vainqueur, c'est un match nul</li>
                  </ul>
                  <button 
                    className="close-guide"
                    onClick={() => setShowGuide(false)}
                  >
                    Masquer le guide
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'explanation' && renderMinMaxExplanation()}
          
          {activeTab === 'history' && renderGameHistory()}
        </div>
      </div>

      <footer className="app-footer">
        <p>Projet d'intelligence artificielle - Algorithme Min-Max avec élagage Alpha-Bêta</p>
      </footer>
    </div>
  );
}

export default App;