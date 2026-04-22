import { useEffect, useState } from "react";

import { createMatch, executeMatchAction, getDashboard } from "./lib/api.js";

const defaultSettings = {
  baseUrl: "http://localhost:8000",
  token: "dev-panel-token",
};

const defaultForm = {
  title: "SM Cup Qualifier",
  map_name: "de_mirage",
  best_of: 1,
  team_a_name: "Sao Miguel Wolves",
  team_a_tag: "SMW",
  team_b_name: "Lisbon Flash",
  team_b_tag: "LFX",
  veto_required: true,
  knife_round: true,
  server_name: "CS2 Arena #1",
  server_address: "127.0.0.1:27015",
};

function readStoredSettings() {
  try {
    return JSON.parse(localStorage.getItem("cs2-panel-settings")) || defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function InfoTile({ label, value, accent }) {
  return (
    <div className={`info-tile ${accent ? `accent-${accent}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MatchCard({ match, onSelect, selected }) {
  return (
    <button
      type="button"
      className={`match-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(match)}
    >
      <div className="match-card-top">
        <span className="eyebrow">{match.map_name}</span>
        <StatusBadge status={match.status} />
      </div>
      <strong>{match.title}</strong>
      <div className="match-card-teams">
        <span>{match.team_a.tag}</span>
        <span>vs</span>
        <span>{match.team_b.tag}</span>
      </div>
      <small>{match.server_name}</small>
    </button>
  );
}

function App() {
  const [settings, setSettings] = useState(readStoredSettings);
  const [dashboard, setDashboard] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [customCommand, setCustomCommand] = useState("say Knife round ready");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem("cs2-panel-settings", JSON.stringify(settings));
  }, [settings]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboard(settings);
      setDashboard(data);

      if (selectedMatch) {
        const nextMatch =
          data.active_match?.id === selectedMatch.id
            ? data.active_match
            : data.queued_matches.find((match) => match.id === selectedMatch.id) || null;
        setSelectedMatch(nextMatch);
      }
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCreateMatch(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        title: form.title,
        map_name: form.map_name,
        best_of: Number(form.best_of),
        team_a: {
          name: form.team_a_name,
          tag: form.team_a_tag,
        },
        team_b: {
          name: form.team_b_name,
          tag: form.team_b_tag,
        },
        veto_required: form.veto_required,
        knife_round: form.knife_round,
        server_name: form.server_name,
        server_address: form.server_address,
      };

      const created = await createMatch({
        ...settings,
        payload,
      });

      setMessage(`Partida criada: ${created.title}`);
      setSelectedMatch(created);
      await loadDashboard();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(matchId, action, payload) {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const result = await executeMatchAction({
        ...settings,
        matchId,
        action,
        payload,
      });

      setMessage(`Acao executada: ${result.action}`);
      await loadDashboard();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const focusMatch =
    selectedMatch || dashboard?.active_match || dashboard?.queued_matches?.[0] || null;

  return (
    <div className="app-shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <aside className="sidebar">
        <div>
          <p className="eyebrow">CS2 match command center</p>
          <h1>Mini Faceit Panel</h1>
          <p className="sidebar-copy">
            Painel para criar partidas, gerir a fila e comandar o servidor via RCON com
            um fluxo rapido para arbitros e admins.
          </p>
        </div>

        <div className="panel settings-panel">
          <div className="section-heading">
            <h2>Ligacao</h2>
            <button type="button" className="ghost-button" onClick={loadDashboard}>
              Atualizar
            </button>
          </div>

          <label>
            API Base URL
            <input
              value={settings.baseUrl}
              onChange={(event) =>
                setSettings((current) => ({ ...current, baseUrl: event.target.value }))
              }
              placeholder="http://localhost:8000"
            />
          </label>

          <label>
            Bearer token
            <input
              value={settings.token}
              onChange={(event) =>
                setSettings((current) => ({ ...current, token: event.target.value }))
              }
              placeholder="dev-panel-token"
            />
          </label>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Estado</h2>
            <StatusBadge status={dashboard?.simulation_mode ? "simulation" : "live"} />
          </div>
          <div className="info-grid compact">
            <InfoTile label="Servidor" value={dashboard?.server_name || "-"} accent="gold" />
            <InfoTile
              label="Endereco"
              value={dashboard?.server_address || "-"}
              accent="blue"
            />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <section className="hero panel">
          <div>
            <p className="eyebrow">Painel operacional</p>
            <h2>Controla partidas CS2 num fluxo de arbitro</h2>
            <p className="hero-copy">
              Cria o lobby, arranca o mapa, pausa, retoma e fecha a serie sem saltar de
              ferramentas.
            </p>
          </div>

          <div className="info-grid">
            <InfoTile
              label="Match ativa"
              value={dashboard?.active_match?.title || "Nenhuma"}
              accent="orange"
            />
            <InfoTile
              label="Fila"
              value={`${dashboard?.queued_matches?.length || 0} partidas`}
              accent="green"
            />
            <InfoTile
              label="Ligacao"
              value={loading ? "A sincronizar" : "Pronta"}
              accent="blue"
            />
          </div>
        </section>

        {error ? <div className="banner error-banner">{error}</div> : null}
        {message ? <div className="banner success-banner">{message}</div> : null}

        <section className="content-grid">
          <div className="stack">
            <div className="panel">
              <div className="section-heading">
                <h2>Partida em foco</h2>
                {focusMatch ? <StatusBadge status={focusMatch.status} /> : null}
              </div>

              {focusMatch ? (
                <div className="focus-panel">
                  <div className="versus-banner">
                    <div>
                      <span className="team-tag">{focusMatch.team_a.tag}</span>
                      <strong>{focusMatch.team_a.name}</strong>
                    </div>
                    <span className="versus-mark">VS</span>
                    <div>
                      <span className="team-tag">{focusMatch.team_b.tag}</span>
                      <strong>{focusMatch.team_b.name}</strong>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <InfoTile label="Mapa" value={focusMatch.map_name} />
                    <InfoTile label="Serie" value={`BO${focusMatch.best_of}`} />
                    <InfoTile label="Servidor" value={focusMatch.server_name} />
                    <InfoTile label="Endereco" value={focusMatch.server_address} />
                  </div>

                  <div className="action-row">
                    <button
                      type="button"
                      className="primary-button"
                      disabled={submitting}
                      onClick={() => handleAction(focusMatch.id, "start")}
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={submitting}
                      onClick={() => handleAction(focusMatch.id, "pause")}
                    >
                      Pausa
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={submitting}
                      onClick={() => handleAction(focusMatch.id, "resume")}
                    >
                      Retomar
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      disabled={submitting}
                      onClick={() => handleAction(focusMatch.id, "end")}
                    >
                      Encerrar
                    </button>
                  </div>

                  <div className="command-box">
                    <label>
                      Comando manual
                      <input
                        value={customCommand}
                        onChange={(event) => setCustomCommand(event.target.value)}
                        placeholder="say Match live"
                      />
                    </label>
                    <button
                      type="button"
                      className="ghost-button strong"
                      disabled={submitting || !customCommand.trim()}
                      onClick={() =>
                        handleAction(focusMatch.id, "command", {
                          command: customCommand,
                        })
                      }
                    >
                      Enviar comando
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <strong>Nenhuma partida selecionada</strong>
                  <p>Cria a primeira partida para comecar a gerir o servidor.</p>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="section-heading">
                <h2>Fila de partidas</h2>
                <span className="muted-copy">
                  {dashboard?.queued_matches?.length || 0} em espera
                </span>
              </div>

              <div className="match-list">
                {dashboard?.active_match ? (
                  <MatchCard
                    match={dashboard.active_match}
                    onSelect={setSelectedMatch}
                    selected={selectedMatch?.id === dashboard.active_match.id}
                  />
                ) : null}

                {dashboard?.queued_matches?.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onSelect={setSelectedMatch}
                    selected={selectedMatch?.id === match.id}
                  />
                ))}

                {!dashboard?.active_match && !dashboard?.queued_matches?.length ? (
                  <div className="empty-state compact">
                    <strong>Sem partidas na fila</strong>
                    <p>O painel mostra aqui o lobby ativo e as proximas series.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <h2>Criar partida</h2>
              <span className="muted-copy">Setup rapido estilo hub</span>
            </div>

            <form className="create-form" onSubmit={handleCreateMatch}>
              <label>
                Titulo
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>

              <div className="form-split">
                <label>
                  Mapa
                  <input
                    value={form.map_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, map_name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Best of
                  <select
                    value={form.best_of}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, best_of: event.target.value }))
                    }
                  >
                    <option value={1}>BO1</option>
                    <option value={3}>BO3</option>
                    <option value={5}>BO5</option>
                  </select>
                </label>
              </div>

              <div className="form-team-grid">
                <div className="team-form-card">
                  <p className="eyebrow">Team A</p>
                  <label>
                    Nome
                    <input
                      value={form.team_a_name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, team_a_name: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Tag
                    <input
                      value={form.team_a_tag}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, team_a_tag: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <div className="team-form-card">
                  <p className="eyebrow">Team B</p>
                  <label>
                    Nome
                    <input
                      value={form.team_b_name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, team_b_name: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Tag
                    <input
                      value={form.team_b_tag}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, team_b_tag: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>

              <label>
                Nome do servidor
                <input
                  value={form.server_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, server_name: event.target.value }))
                  }
                />
              </label>

              <label>
                Endereco do servidor
                <input
                  value={form.server_address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, server_address: event.target.value }))
                  }
                />
              </label>

              <div className="toggle-row">
                <label className="toggle-chip">
                  <input
                    type="checkbox"
                    checked={form.veto_required}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        veto_required: event.target.checked,
                      }))
                    }
                  />
                  Veto obrigatorio
                </label>
                <label className="toggle-chip">
                  <input
                    type="checkbox"
                    checked={form.knife_round}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        knife_round: event.target.checked,
                      }))
                    }
                  />
                  Knife round
                </label>
              </div>

              <button type="submit" className="primary-button large" disabled={submitting}>
                {submitting ? "A processar..." : "Criar partida"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
