"use client";

import { useEffect, useState } from "react";
import { SettingsState } from "@/lib/lostark/types";
import { defaultSettingsState, readSettingsState, writeSettingsState } from "@/lib/lostark/storage";

export function SettingsClient() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettingsState);

  useEffect(() => {
    setSettings(readSettingsState());
  }, []);

  function save(patch: Partial<SettingsState>) {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      writeSettingsState(next);
      return next;
    });
  }

  return (
    <div className="settings-page">
      <div className="header">
        <h1>Settings</h1>
      </div>
      <section className="card">
        <h2>Checklist behavior</h2>
        <div className="settings-grid">
          <label>
            Region
            <select
              value={settings.region}
              onChange={(event) => {
                const { value } = event.currentTarget;
                save({ region: value as SettingsState["region"] });
              }}
            >
              <option value="EU">EU</option>
              <option value="NA">NA</option>
              <option value="KR">KR</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.hiddenOnCompletion}
              onChange={(event) => {
                const { checked } = event.currentTarget;
                save({ hiddenOnCompletion: checked });
              }}
            />
            Hide completed tasks
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.showHiddenCharacters}
              onChange={(event) => {
                const { checked } = event.currentTarget;
                save({ showHiddenCharacters: checked });
              }}
            />
            Show hidden characters by default
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.lazyTrackingEnabled}
              onChange={(event) => {
                const { checked } = event.currentTarget;
                save({ lazyTrackingEnabled: checked });
              }}
            />
            Enable lazy tracking offset
          </label>
        </div>
      </section>
    </div>
  );
}
