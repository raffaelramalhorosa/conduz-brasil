import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileUploadArea } from './FileUploadArea';
import { RegistrationData } from '@/hooks/useRegistrationForm';

interface StepDocumentationProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
  errors: Record<string, string>;
}

export function StepDocumentation({ data, onChange, errors }: StepDocumentationProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Agora, valide seus documentos
        </h2>
        <p className="text-muted-foreground">
          Envie os documentos necessários para verificação da sua conta
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-foreground">Documentos necessários</p>
          <p className="text-sm text-muted-foreground mt-1">
            Seus documentos serão verificados em até 48h úteis. Você receberá uma notificação por email quando a análise for concluída.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <FileUploadArea
          label="CNH (frente e verso)"
          accept="image/*,.pdf"
          value={data.cnhFile}
          onChange={(file) => onChange({ cnhFile: file as File | null })}
          error={errors.cnhFile}
        />

        <FileUploadArea
          label="Certidão de Credenciamento como Instrutor (Detran)"
          accept="image/*,.pdf"
          value={data.credentialFile}
          onChange={(file) => onChange({ credentialFile: file as File | null })}
          error={errors.credentialFile}
        />

        <FileUploadArea
          label="Foto de perfil"
          accept="image/*"
          value={data.profilePhoto}
          onChange={(file) => onChange({ profilePhoto: file as File | null })}
          error={errors.profilePhoto}
        />

        {data.accountType === 'school' && (
          <FileUploadArea
            label="Alvará de funcionamento"
            accept="image/*,.pdf"
            value={data.businessLicense}
            onChange={(file) => onChange({ businessLicense: file as File | null })}
            error={errors.businessLicense}
          />
        )}
      </div>

      <div className="flex items-start gap-3 pt-4">
        <Checkbox
          id="documentsVerified"
          checked={data.documentsVerified}
          onCheckedChange={(checked) => onChange({ documentsVerified: checked as boolean })}
        />
        <div>
          <Label
            htmlFor="documentsVerified"
            className="text-sm font-medium cursor-pointer"
          >
            Certifico que os documentos enviados são verdadeiros
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Ao marcar esta opção, você declara que todos os documentos enviados são autênticos e que as informações contidas são verdadeiras.
          </p>
        </div>
      </div>
      {errors.documentsVerified && (
        <p className="text-sm text-destructive">{errors.documentsVerified}</p>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Dicas para aprovação rápida
        </h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Envie fotos nítidas e bem iluminadas</li>
          <li>• Certifique-se de que todos os dados estão legíveis</li>
          <li>• A CNH deve estar dentro da validade</li>
          <li>• Use arquivos PDF ou imagens em alta resolução</li>
        </ul>
      </div>
    </div>
  );
}
