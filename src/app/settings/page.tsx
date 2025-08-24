"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RefreshCw } from "lucide-react";
import { 
  getAllPlatformSettings, 
  upsertPlatformSettings, 
  initializeDefaultSettings,
  type PlatformSettings
} from "@/lib/database";

export default function Settings() {
  const [settings, setSettings] = useState<PlatformSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Initialize default settings if none exist
      await initializeDefaultSettings();
      const allSettings = await getAllPlatformSettings();
      setSettings(allSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'שגיאה בטעינת ההגדרות' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (platform: string, field: keyof PlatformSettings, value: string | number) => {
    setSettings(prev => prev.map(setting => 
      setting.platform === platform 
        ? { ...setting, [field]: value }
        : setting
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Save all settings
      const savePromises = settings.map(setting => 
        upsertPlatformSettings({
          platform: setting.platform,
          display_name: setting.display_name,
          buy_fee_usd: setting.buy_fee_usd,
          sell_fee_usd: setting.sell_fee_usd
        })
      );

      await Promise.all(savePromises);
      setMessage({ type: 'success', text: 'ההגדרות נשמרו בהצלחה!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'שגיאה בשמירת ההגדרות' });
    } finally {
      setSaving(false);
    }
  };

  const getPlatformDisplayName = (platform: string) => {
    const platformNames = {
      kraken: 'Kraken',
      ibkr: 'IBKR',
      extrade: 'Extrade'
    };
    return platformNames[platform as keyof typeof platformNames] || platform;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">טוען הגדרות...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-right">הגדרות</h1>
        <div className="flex gap-2">
          <Button 
            onClick={loadSettings} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'שומר...' : 'שמור הגדרות'}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {settings.map((setting) => (
          <Card key={setting.platform} className="h-fit">
            <CardHeader>
              <CardTitle className="text-right text-xl">
                {getPlatformDisplayName(setting.platform)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">
                  שם התיק
                </label>
                <input
                  type="text"
                  value={setting.display_name}
                  onChange={(e) => handleSettingChange(setting.platform, 'display_name', e.target.value)}
                  className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="הזן שם התיק"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right">
                  עמלת קנייה ($)
                </label>
                <input
                  type="number"
                  value={setting.buy_fee_usd}
                  onChange={(e) => {
                    const fee = parseFloat(e.target.value);
                    handleSettingChange(setting.platform, 'buy_fee_usd', fee);
                  }}
                  className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="1.00"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  לדוגמה: 1.00 = $1 לכל עסקה
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right">
                  עמלת מכירה ($)
                </label>
                <input
                  type="number"
                  value={setting.sell_fee_usd}
                  onChange={(e) => {
                    const fee = parseFloat(e.target.value);
                    handleSettingChange(setting.platform, 'sell_fee_usd', fee);
                  }}
                  className="w-full p-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-right"
                  placeholder="1.00"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  לדוגמה: 1.00 = $1 לכל עסקה
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-right mb-2">מידע על העמלות</h3>
        <ul className="text-right text-sm text-gray-700 space-y-1">
          <li>• העמלות יוחלו אוטומטית על עסקאות חדשות</li>
          <li>• עמלת קנייה: סכום קבוע בדולרים לכל עסקת קנייה</li>
          <li>• עמלת מכירה: סכום קבוע בדולרים לכל עסקת מכירה</li>
          <li>• לדוגמה: עמלה של $1 לכל עסקה, ללא קשר לגודל העסקה</li>
        </ul>
      </div>
    </div>
  );
}