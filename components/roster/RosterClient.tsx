"use client";

import { useEffect, useState } from "react";
import { Character, RosterState } from "@/lib/lostark/types";
import { defaultRosterState, readRosterState, writeRosterState } from "@/lib/lostark/storage";

const emptyCharacter: Character = {
  name: "",
  ilvl: 1540,
  lazy: false,
  weeklyGold: true,
  isHide: false
};

export function RosterClient() {
  const [roster, setRoster] = useState<RosterState>(defaultRosterState);
  const [form, setForm] = useState<Character>(emptyCharacter);

  useEffect(() => {
    setRoster(readRosterState());
  }, []);

  function save(next: RosterState) {
    setRoster(next);
    writeRosterState(next);
  }

  function addCharacter() {
    const normalizedName = form.name.trim();
    if (!normalizedName) {
      return;
    }
    const next: RosterState = {
      ...roster,
      characters: [
        ...roster.characters,
        {
          ...form,
          name: normalizedName
        }
      ]
    };
    save(next);
    setForm(emptyCharacter);
  }

  function updateCharacter(index: number, patch: Partial<Character>) {
    const nextCharacters = roster.characters.map((character, idx) =>
      idx === index ? { ...character, ...patch } : character
    );
    save({ ...roster, characters: nextCharacters });
  }

  function removeCharacter(index: number) {
    const nextCharacters = roster.characters.filter((_, idx) => idx !== index);
    save({ ...roster, characters: nextCharacters });
  }

  return (
    <div className="roster-page">
      <div className="header">
        <h1>Roster</h1>
      </div>

      <section className="card roster-form">
        <h2>Add character</h2>
        <div className="form-grid">
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.currentTarget.value }))}
            />
          </label>
          <label>
            iLvl
            <input
              type="number"
              value={form.ilvl}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, ilvl: Number(event.currentTarget.value) || 0 }))
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.lazy}
              onChange={(event) => setForm((previous) => ({ ...previous, lazy: event.currentTarget.checked }))}
            />
            Lazy tracking
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.weeklyGold}
              onChange={(event) => setForm((previous) => ({ ...previous, weeklyGold: event.currentTarget.checked }))}
            />
            Weekly gold
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(form.isHide)}
              onChange={(event) => setForm((previous) => ({ ...previous, isHide: event.currentTarget.checked }))}
            />
            Hidden
          </label>
          <button type="button" className="task-btn" onClick={addCharacter}>
            Add
          </button>
        </div>
      </section>

      <section className="card roster-settings">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={roster.showAllTasks}
            onChange={(event) => save({ ...roster, showAllTasks: event.currentTarget.checked })}
          />
          Show all tasks (including tasks unavailable today)
        </label>
      </section>

      <section className="card">
        <h2>Characters</h2>
        {roster.characters.length === 0 ? (
          <p>Chua co character nao.</p>
        ) : (
          <table className="checklist-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>iLvl</th>
                <th>Lazy</th>
                <th>Weekly Gold</th>
                <th>Hidden</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roster.characters.map((character, index) => (
                <tr key={`${character.name}-${index}`}>
                  <td>{character.name}</td>
                  <td>
                    <input
                      type="number"
                      value={character.ilvl}
                      onChange={(event) =>
                        updateCharacter(index, { ilvl: Number(event.currentTarget.value) || character.ilvl })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={character.lazy}
                      onChange={(event) => updateCharacter(index, { lazy: event.currentTarget.checked })}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={character.weeklyGold}
                      onChange={(event) => updateCharacter(index, { weeklyGold: event.currentTarget.checked })}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(character.isHide)}
                      onChange={(event) => updateCharacter(index, { isHide: event.currentTarget.checked })}
                    />
                  </td>
                  <td>
                    <button type="button" className="task-btn reset" onClick={() => removeCharacter(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
