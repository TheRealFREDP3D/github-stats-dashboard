import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useLLM } from '@/contexts/LLMContext.jsx';
import { Settings, Key, Check } from 'lucide-react';

export function LLMSettingsDialog({ open, onOpenChange }) {
  const { provider, apiKeys, setProvider, setApiKey } = useLLM();
  const [localProvider, setLocalProvider] = useState(provider);
  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setLocalProvider(provider);
      setLocalKeys(apiKeys);
      setErrors({});
    }
  }, [open, provider, apiKeys]);

  const handleProviderChange = (value) => {
    setLocalProvider(value);
    setErrors({});
  };

  const handleKeyChange = (provider, value) => {
    setLocalKeys(prev => ({ ...prev, [provider]: value }));
    if (errors[provider]) {
      setErrors(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleSave = () => {
    const newErrors = {};
    if (!localKeys[localProvider]?.trim()) {
      newErrors[localProvider] = true;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setProvider(localProvider);
    setApiKey(localProvider, localKeys[localProvider].trim());
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getHelpText = (provider) => {
    switch (provider) {
      case 'openrouter':
        return 'Get your API key from https://openrouter.ai/keys';
      case 'gemini':
        return 'Get your API key from https://ai.google.dev/aistudio';
      case 'openai':
        return 'Get your API key from https://platform.openai.com/api-keys';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            LLM Settings
          </DialogTitle>
          <DialogDescription>
            Configure your preferred LLM provider and API key for code analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="provider" className="text-sm font-medium">
              Provider
            </label>
            <Select value={localProvider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="apiKey" className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder={`Enter your ${localProvider} API key`}
              value={localKeys[localProvider] || ''}
              onChange={(e) => handleKeyChange(localProvider, e.target.value)}
              className={errors[localProvider] ? 'border-destructive' : ''}
            />
            {errors[localProvider] && (
              <p className="text-sm text-destructive">API key is required</p>
            )}
            <p className="text-xs text-muted-foreground">
              {getHelpText(localProvider)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}