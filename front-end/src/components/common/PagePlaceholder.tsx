import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  parte?: string;
}

export function PagePlaceholder({ title, description, parte }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-warning" />
            <CardTitle className="text-base">Em construção</CardTitle>
          </div>
          <CardDescription>
            Esta tela será implementada {parte ?? "em uma próxima parte"} do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Layout base, sidebar, header, design system e rotas já estão prontos (Parte 1).
        </CardContent>
      </Card>
    </div>
  );
}
