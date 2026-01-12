import { useState } from "react";
import type { Settings } from "~lib/types";
import { DEFAULT_SETTINGS } from "~lib/types";
import { getSettings, saveSettings } from "~lib/storage";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [dailyLimit, setDailyLimit] = useState("30");
  const [presetInput, setPresetInput] = useState("");
  const [presets, setPresets] = useState<number[]>([1, 5, 10, 20]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    const currentSettings = await getSettings();
    setSettings(currentSettings);
    setDailyLimit(currentSettings.dailyLimitMinutes.toString());
    setPresets(currentSettings.presetMinutes);
  };

  const handleSaveSettings = async (onSuccess?: () => void) => {
    const limit = parseInt(dailyLimit, 10);

    if (isNaN(limit) || limit <= 0) {
      setMessage("1日の制限時間は正の数である必要があります");
      return;
    }

    if (presets.length === 0) {
      setMessage("少なくとも1つのプリセット時間を設定してください");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const newSettings: Settings = {
        dailyLimitMinutes: limit,
        presetMinutes: presets,
      };

      await saveSettings(newSettings);
      setSettings(newSettings);
      setMessage("設定を保存しました");

      if (onSuccess) {
        await onSuccess();
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPreset = () => {
    const value = parseInt(presetInput, 10);

    if (isNaN(value) || value <= 0) {
      setMessage("プリセット時間は正の数である必要があります");
      return;
    }

    if (presets.includes(value)) {
      setMessage("この時間は既に登録されています");
      return;
    }

    setPresets([...presets, value].sort((a, b) => a - b));
    setPresetInput("");
    setMessage("");
  };

  const handleRemovePreset = (value: number) => {
    setPresets(presets.filter((p) => p !== value));
  };

  return {
    settings,
    dailyLimit,
    setDailyLimit,
    presetInput,
    setPresetInput,
    presets,
    saving,
    message,
    loadSettings,
    handleSaveSettings,
    handleAddPreset,
    handleRemovePreset,
  };
}
