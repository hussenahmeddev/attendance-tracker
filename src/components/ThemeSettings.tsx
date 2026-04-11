import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Preference</CardTitle>
        <CardDescription>
          Choose your preferred theme. This setting is saved to your account and will apply across all your devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark")}>
          <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light" className="flex items-center gap-3 cursor-pointer flex-1">
              <Sun className="h-5 w-5" />
              <div>
                <div className="font-medium">Light</div>
                <div className="text-sm text-muted-foreground">
                  Use light theme
                </div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark" className="flex items-center gap-3 cursor-pointer flex-1">
              <Moon className="h-5 w-5" />
              <div>
                <div className="font-medium">Dark</div>
                <div className="text-sm text-muted-foreground">
                  Use dark theme
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current theme:</span>
            <span className="font-medium capitalize">{theme}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
