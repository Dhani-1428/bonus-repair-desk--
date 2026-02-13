"use client"

import { useTranslation } from "@/components/language-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

const languages = [
  { code: "en" as const, name: "English", nativeName: "English" },
  { code: "es" as const, name: "Spanish", nativeName: "Español" },
  { code: "fr" as const, name: "French", nativeName: "Français" },
  { code: "de" as const, name: "German", nativeName: "Deutsch" },
  { code: "it" as const, name: "Italian", nativeName: "Italiano" },
  { code: "pt" as const, name: "Portuguese", nativeName: "Português" },
  { code: "nl" as const, name: "Dutch", nativeName: "Nederlands" },
  { code: "pl" as const, name: "Polish", nativeName: "Polski" },
  { code: "ro" as const, name: "Romanian", nativeName: "Română" },
  { code: "el" as const, name: "Greek", nativeName: "Ελληνικά" },
  { code: "cs" as const, name: "Czech", nativeName: "Čeština" },
  { code: "hu" as const, name: "Hungarian", nativeName: "Magyar" },
  { code: "sv" as const, name: "Swedish", nativeName: "Svenska" },
  { code: "fi" as const, name: "Finnish", nativeName: "Suomi" },
  { code: "da" as const, name: "Danish", nativeName: "Dansk" },
  { code: "bg" as const, name: "Bulgarian", nativeName: "Български" },
  { code: "hr" as const, name: "Croatian", nativeName: "Hrvatski" },
  { code: "sk" as const, name: "Slovak", nativeName: "Slovenčina" },
  { code: "sl" as const, name: "Slovenian", nativeName: "Slovenščina" },
  { code: "lt" as const, name: "Lithuanian", nativeName: "Lietuvių" },
  { code: "lv" as const, name: "Latvian", nativeName: "Latviešu" },
  { code: "et" as const, name: "Estonian", nativeName: "Eesti" },
  { code: "ga" as const, name: "Irish", nativeName: "Gaeilge" },
  { code: "mt" as const, name: "Maltese", nativeName: "Malti" },
]

export function WebsiteLanguageSelector() {
  const { language, setLanguage } = useTranslation()
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? "bg-accent" : ""}
          >
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
