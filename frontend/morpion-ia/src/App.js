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
  const [minimaxIterations, setMinimaxIterations] = useState([]);
  const [showIterations, setShowIterations] = useState(false);

  const API_BASE_URL = 'http://localhost:5000';

  const makeMove = async (index) => {
    if (board[index] !== " " || winner || isLoading) return;

    setIsLoading(true);
    setError(null);
    setThinkingProcess(["L'IA réfléchit à son prochain coup..."]);
    
    // Appel à simulateThinkingProcess
    simulateThinkingProcess();

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

      await fetchIterations();
      
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

  const fetchIterations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/iterations`);
      if (response.ok) {
        const data = await response.json();
        setMinimaxIterations(data.iterations || []);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des itérations:', error);
    }
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
    setMinimaxIterations([]);
    setShowIterations(false);
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

  const formatBoard = (boardArray) => {
    if (!boardArray || !Array.isArray(boardArray)) return '';
    
    return (
      <div className="iteration-board">
        <div className="iteration-row">
          {boardArray.slice(0, 3).map((cell, idx) => (
            <div key={idx} className="iteration-cell">
              {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : '⬜'}
            </div>
          ))}
        </div>
        <div className="iteration-row">
          {boardArray.slice(3, 6).map((cell, idx) => (
            <div key={idx} className="iteration-cell">
              {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : '⬜'}
            </div>
          ))}
        </div>
        <div className="iteration-row">
          {boardArray.slice(6, 9).map((cell, idx) => (
            <div key={idx} className="iteration-cell">
              {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : '⬜'}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderIterations = () => {
    if (!minimaxIterations || minimaxIterations.length === 0) {
      return <p className="no-iterations">Aucune itération à afficher pour le moment.</p>;
    }

    return (
      <div className="iterations-container">
        <h3>Itérations de l'algorithme Minimax</h3>
        <div className="iterations-list">
          {minimaxIterations.map((iteration, index) => (
            <div key={index} className="iteration-item">
              <div className="iteration-header">
                <span className="iteration-number">Itération #{index + 1}</span>
                <span className="iteration-depth">Profondeur: {iteration.depth}</span>
                <span className="iteration-type">
                  {iteration.is_maximizing ? 'Maximisation (⭕)' : 'Minimisation (❌)'}
                </span>
              </div>
              <div className="iteration-details">
                <div className="iteration-board-container">
                  {formatBoard(iteration.board)}
                </div>
                <div className="iteration-scores">
                  <div className="iteration-score">
                    <span className="score-label">Alpha:</span>
                    <span className="score-value">{iteration.alpha}</span>
                  </div>
                  <div className="iteration-score">
                    <span className="score-label">Bêta:</span>
                    <span className="score-value">{iteration.beta}</span>
                  </div>
                  <div className="iteration-score">
                    <span className="score-label">Score:</span>
                    <span className="score-value">{iteration.score !== undefined ? iteration.score : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
        <div className="explanation">
          <h2>🧠 Algorithme Min-Max avec Élagage Alpha-Bêta</h2>
          
          <div className="minimax-definition">
            <h3>Algorithme Min-Max — Exemple détaillé (Tic-Tac-Toe / XO)</h3>
            <p>Min-Max choisit le meilleur coup pour MAX (X) en supposant que MIN (O) joue optimalement.</p>

            <div className="algorithm-step">
              <h4>1. Définition du plateau</h4>
              <p>Plateau : tableau de 9 cases (indices 0..8)</p>
              <p>Disposition visuelle :</p>
              <div className="code-block">
                <pre>{`  0 | 1 | 2
  ---------
  3 | 4 | 5
  ---------
  6 | 7 | 8`}</pre>
              </div>
              <p>Valeurs : 'X' = MAX (ordinateur), 'O' = MIN (adversaire), ' ' = vide</p>
            </div>

            <div className="algorithm-step">
              <h4>2. Vérifier le gagnant</h4>
              <p>Fonction <code>check_gagnant(plateau)</code> :</p>
              <div className="code-block">
                <pre>{`  pour chaque combinaison gagnante (3 en ligne):
      si les 3 cases contiennent 'X' → retourner "X"
      si les 3 cases contiennent 'O' → retourner "O"
  si aucune case vide → retourner "Match nul"
  sinon → retourner "Aucun"  // partie non terminée`}</pre>
              </div>
            </div>

            <div className="algorithm-step">
              <h4>3. Fonction Min-Max (récursive)</h4>
              <p>Fonction <code>minimax(plateau, joueur)</code> :</p>
              <div className="code-block">
                <pre>{`  résultat = check_gagnant(plateau)

  // --- Cas de base ---
  si résultat = "X" → retourner +1      // victoire MAX
  si résultat = "O" → retourner -1      // victoire MIN
  si résultat = "Match nul" → retourner 0

  // --- Tour de MAX (X) ---
  si joueur = "X":
      meilleur_score = -∞
      pour chaque case i vide dans plateau:
          placer 'X' en i
          score = minimax(plateau, "O")   // appel récursif pour MIN
          annuler le coup (vider i)
          meilleur_score = max(meilleur_score, score)
      retourner meilleur_score

  // --- Tour de MIN (O) ---
  sinon si joueur = "O":
      meilleur_score = +∞
      pour chaque case i vide dans plateau:
          placer 'O' en i
          score = minimax(plateau, "X")   // appel récursif pour MAX
          annuler le coup
          meilleur_score = min(meilleur_score, score)
      retourner meilleur_score`}</pre>
              </div>
            </div>

            <div className="algorithm-step">
              <h4>4. Fonction pour choisir le meilleur coup (pour X)</h4>
              <p>Fonction <code>meilleur_coup(plateau)</code> :</p>
              <div className="code-block">
                <pre>{`  meilleur_score = -∞
  coup_choisi = -1

  pour chaque case i vide dans plateau:
      placer 'X' en i
      score = minimax(plateau, "O")   // simuler la suite
      annuler le coup
      si score > meilleur_score:
          meilleur_score = score
          coup_choisi = i

  retourner coup_choisi`}</pre>
              </div>
            </div>

            <div className="algorithm-step">
              <h4>5. Exemple d'exécution (concret)</h4>
              <p>Plateau initial :</p>
              <div className="code-block">
                <pre>{`  [ X , O , X ,
    vide , O , vide ,
    vide , vide , vide ]`}</pre>
              </div>
              <p>Indices vides : 3, 5, 6, 7, 8</p>
              <p>Évaluations (résultats de minimax après simulation) :</p>
              <ul>
                <li>Essai coup en 3 → score = -1  (Mauvais : MIN peut forcer la victoire)</li>
                <li>Essai coup en 5 → score = 0   (Au moins match nul)</li>
                <li>Essai coup en 6 → score = -1</li>
                <li>Essai coup en 7 → score = 0   (Au moins match nul)</li>
                <li>Essai coup en 8 → score = -1</li>
              </ul>
              <p>Résultat : meilleur_coup retourne 5 ou 7 (score = 0). MAX choisit donc une case qui <strong>garantit au minimum le match nul</strong>.</p>
            </div>

            <div className="algorithm-step">
              <h4>Explication pas à pas (comme Dijkstra)</h4>
              <ol>
                <li>Initialiser : tester si l'état courant est terminal (victoire/défaite/nul).</li>
                <li>Explorer : pour chaque coup possible, simuler le coup puis appeler minimax récursivement.</li>
                <li>Si c'est le niveau MAX → choisir le maximum des scores retournés.</li>
                <li>Si c'est le niveau MIN → choisir le minimum (MIN minimise la réussite de MAX).</li>
                <li>Backtrack : après chaque simulation, annuler le coup pour tester le suivant.</li>
                <li>Répéter : continuer jusqu'à états terminaux (feuilles de l'arbre).</li>
                <li>Résultat : meilleur_coup renvoie l'indice qui maximise la valeur pour MAX (&gt;0 bon pour X, 0 = nul, &lt;0 mauvais).</li>
              </ol>
            </div>
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
          <div className="complexity-section">
            <h4>🔢 Exemple : Arbre Min-Max avec valeurs croissantes</h4>
            <div className="tree-diagram">
              <pre>{`
                    [MAX]                <-- Niveau 0, depth=0
                   /   |   \\
                 /     |     \\
             [MIN]    [MIN]    [MIN]    <-- Niveau 1, depth=1
           /  |  \\  /  |  \\  /  |  \\
         1   2   3  4   5   6  7   8   9  <-- Feuilles (niveau 2, depth=2)
              `}</pre>
            </div>
            
            <div className="complexity-step-by-step">
              <h5>🔹 Explication étape par étape</h5>
              <ul>
                <li><strong>Feuilles</strong> : ce sont les scores finaux pour MAX si le jeu arrive à ces états.</li>
                <li>On a mis des valeurs croissantes de 1 à 9 pour que ce soit clair.</li>
                <li><strong>Niveau MIN</strong> : chaque MIN va choisir le minimum parmi ses enfants.
                  <ul>
                    <li>MIN gauche → min(1,2,3) = 1</li>
                    <li>MIN du milieu → min(4,5,6) = 4</li>
                    <li>MIN droite → min(7,8,9) = 7</li>
                  </ul>
                </li>
                <li><strong>Niveau MAX (racine)</strong> : MAX choisit le maximum parmi les valeurs remontées par MIN.
                  <ul>
                    <li>MAX → max(1,4,7) = 7</li>
                  </ul>
                </li>
                <li>Donc le meilleur coup pour MAX correspond au nœud droit.</li>
              </ul>
            </div>
            
            <div className="complexity-legend">
              <h5>🔹 Légende</h5>
              <ul>
                <li><strong>Nœud</strong> = état du jeu (plateau).</li>
                <li><strong>MAX</strong> = joueur qui veut maximiser le score.</li>
                <li><strong>MIN</strong> = joueur qui veut minimiser le score.</li>
                <li><strong>b</strong> = branching factor → nombre de coups possibles par nœud.</li>
                <li><strong>d</strong> = profondeur de l'arbre → nombre de tours jusqu'à la fin.</li>
                <li><strong>Feuilles</strong> = score final du plateau.</li>
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
      
      <div className="minimax-definition">
        <h3>✅ Définition de l'algorithme Min-Max</h3>
        <p>
          L'algorithme Min-Max est une méthode de décision utilisée dans les jeux à deux joueurs 
          (parfaitement déterministes, sans hasard, et à somme nulle).
        </p>
        
        <p>
          Un joueur est appelé <strong>Max</strong> (il cherche à maximiser le score).<br />
          L'autre est appelé <strong>Min</strong> (il cherche à minimiser le score).
        </p>
        
        <p>
          L'algorithme explore l'arbre de jeu en simulant tous les coups possibles des deux joueurs, 
          jusqu'aux positions finales (ou jusqu'à une profondeur donnée).
        </p>
        
        <p>
          Ensuite, il attribue une valeur à chaque position finale (victoire, défaite, nul).<br />
          Enfin, en remontant l'arbre, chaque joueur choisit le meilleur coup pour lui :
        </p>
        
        <ul>
          <li><strong>Max</strong> prend le maximum des valeurs disponibles.</li>
          <li><strong>Min</strong> prend le minimum des valeurs disponibles.</li>
        </ul>
        
        <p>👉 Le résultat est le coup optimal pour le joueur courant, en supposant que les deux jouent parfaitement.</p>
        
        <h4>✅ Utilisation du Min-Max</h4>
        <p>L'algorithme Min-Max est utilisé dans :</p>
        
        <h5>Les jeux de stratégie à deux joueurs :</h5>
        <ul>
          <li>Morpion (Tic-Tac-Toe)</li>
          <li>Puissance 4</li>
          <li>Dames</li>
          <li>Échecs (avec optimisations et heuristiques)</li>
          <li>Othello/Reversi</li>
        </ul>
        
        <h5>L'intelligence artificielle :</h5>
        <p>Pour créer une IA capable de prendre des décisions rationnelles face à un adversaire.</p>
        
        <h5>La théorie des jeux :</h5>
        <p>Pour analyser des stratégies optimales dans des situations compétitives à somme nulle.</p>
        
        <h4>📌 Exemple concret :</h4>
        <p>
          Dans le morpion, si c'est au tour de l'IA (joueur O), elle utilise Min-Max pour :
        </p>
        <ol>
          <li>Simuler tous ses coups possibles,</li>
          <li>Simuler les réponses de l'adversaire (X),</li>
          <li>Puis choisir le coup qui maximise ses chances de gagner ou au pire d'aboutir à un match nul.</li>
        </ol>
      </div>

      <div className="algorithm-steps">
        <div className="step">
          <div className="step-number">🔍</div>
          <div className="step-content">
            <h3>1. Exploration de l'arbre de jeu</h3>
            <p>L'algorithme explore récursivement tous les coups possibles à partir de la position actuelle, créant un "arbre" des possibilités. Chaque nœud représente un état du jeu, et chaque branche représente un coup possible.</p>
            <p className="step-importance"><strong>Pourquoi c'est important :</strong> Sans cette exploration exhaustive, l'IA ne pourrait pas anticiper les conséquences de ses choix.</p>
          </div>
        </div>
        
        <div className="step">
          <div className="step-number">📊</div>
          <div className="step-content">
            <h3>2. Évaluation des positions</h3>
            <p>À chaque position terminale (fin de jeu ou limite de profondeur), l'algorithme attribue une valeur :</p>
            <ul>
              <li><strong>+1</strong> : Victoire de l'IA (favorable)</li>
              <li><strong>-1</strong> : Victoire du joueur (défavorable)</li>
              <li><strong>0</strong> : Match nul (neutre)</li>
            </ul>
            <p className="step-importance"><strong>Pourquoi c'est important :</strong> Ces valeurs quantifient le résultat de chaque séquence de coups, permettant des comparaisons objectives.</p>
          </div>
        </div>
        
        <div className="step">
          <div className="step-number">🔄</div>
          <div className="step-content">
            <h3>3. Propagation des valeurs</h3>
            <p>Les valeurs remontent l'arbre de décision :</p>
            <ul>
              <li>Aux niveaux <strong>Max</strong> (tour de l'IA) : sélection de la valeur maximale</li>
              <li>Aux niveaux <strong>Min</strong> (tour du joueur) : sélection de la valeur minimale</li>
            </ul>
            <p className="step-importance"><strong>Pourquoi c'est important :</strong> Cela simule le comportement rationnel des two joueurs - l'IA cherche à maximiser son avantage tandis que le joueur cherche à le minimiser.</p>
          </div>
        </div>
        
        <div className="step">
          <div className="step-number">✂️</div>
          <div className="step-content">
            <h3>4. Élagage Alpha-Bêta</h3>
            <p>Technique d'optimisation qui permet d'éliminer les branches de l'arbre qui ne peuvent pas influencer le résultat final, réduisant ainsi le nombre de positions à évaluer.</p>
            <p className="step-importance"><strong>Pourquoi c'est important :</strong> Sans élagage, l'algorithme serait trop lent pour être utilisable, surtout pour des jeux complexes.</p>
          </div>
        </div>
        
        <div className="step">
          <div className="step-number">🎯</div>
          <div className="step-content">
            <h3>5. Sélection du meilleur coup</h3>
            <p>Après l'évaluation complète, l'IA choisit le coup qui mène à la position avec le score le plus élevé, en supposant que le joueur adverse joue de façon optimale.</p>
            <p className="step-importance"><strong>Pourquoi c'est important :</strong> C'est le résultat concret de tout le processus - la décision que l'IA va réellement prendre.</p>
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
      
      {minimaxIterations.length > 0 && (
        <div className="minimax-iterations">
          <h4>Détails de l'algorithme Minimax</h4>
          <div className="iterations-toggle">
            <button 
              onClick={() => setShowIterations(!showIterations)}
              className="toggle-btn"
            >
              {showIterations ? 'Masquer les itérations' : 'Afficher les itérations détaillées'}
            </button>
          </div>
          {showIterations && renderIterations()}
        </div>
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