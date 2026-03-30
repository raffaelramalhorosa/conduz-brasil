# Auditoria UI/UX — Conduz Brasil
**Data:** 2026-03-30
**Escopo:** Responsividade, legibilidade e comportamento de texto
**Status:** Relatório — SEM alterações de código

---

## FASE 1 — MAPEAMENTO DE ARQUIVOS

### Páginas (src/pages/)
```
pages/
├── Index.tsx
├── LandingPage.tsx
├── Marketplace.tsx
├── InstructorProfile.tsx
├── UserProfile.tsx
├── EditProfile.tsx
├── Settings.tsx
├── PublicInstructorMap.tsx
├── AcceptInvite.tsx
├── InstallElectron.tsx
├── NotFound.tsx
├── auth/
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── ForgotPassword.tsx
│   └── VerifyEmail.tsx
├── admin/
│   ├── AdminDashboard.tsx
│   ├── AdminAppointments.tsx
│   ├── AdminCalendario.tsx
│   ├── AdminFinancial.tsx
│   ├── AdminInstrutores.tsx
│   ├── AdminMedia.tsx
│   ├── AdminMessages.tsx
│   ├── AdminProfile.tsx
│   ├── AdminReviews.tsx
│   ├── AdminVehicles.tsx
│   ├── AdminAssinaturas.tsx
│   ├── PersonalizarDashboard.tsx
│   └── SchoolFinancialDashboard.tsx
├── student/
│   ├── StudentDashboard.tsx
│   ├── StudentCalendario.tsx
│   ├── StudentLessons.tsx
│   ├── StudentMessages.tsx
│   ├── StudentFavorites.tsx
│   ├── StudentRefunds.tsx
│   ├── InstructorMap.tsx
│   ├── JornadaCNH.tsx
│   └── Simulado.tsx
├── onboarding/
│   ├── OnboardingStart.tsx
│   ├── DadosBasicos.tsx
│   ├── Documentacao.tsx
│   ├── InformacoesProfissionais.tsx
│   └── Finalizacao.tsx
├── system-admin/
│   ├── SystemAdminDashboard.tsx
│   ├── PendingInstructors.tsx
│   ├── ApprovedInstructors.tsx
│   ├── InstructorDocuments.tsx
│   └── PlatformSettings.tsx
└── pagamento/
    ├── PagamentoPendente.tsx
    ├── PagamentoSucesso.tsx
    └── PagamentoErro.tsx
```

### Componentes (src/components/)
```
components/
├── NavBar.tsx, Header.tsx, Footer.tsx, HeroSection.tsx
├── admin/
│   ├── AdminLayout.tsx, AdminSidebar.tsx, AdminHeader.tsx
│   ├── AppointmentTableView.tsx, BookingDetailsModal.tsx
│   ├── VehicleModal.tsx, MpConnectionCard.tsx
│   └── financial/ (BalanceCards, TransactionsTable, WithdrawModal)
├── auth/ (AuthLayout, ProtectedRoute, PendingApprovalGate)
├── marketplace/ (FilterBar, FilterSidebar, InstructorCard, MobileInstructorCard)
├── profile/ (ProfileHeader, BookingModal, ReviewsCard, VehiclesCard, BookingCard)
├── instructor/ (InstructorDashboardLayout, InstructorSidebar, InstructorHeader)
├── student/ (StudentLayout, StudentHeader, LessonCard, modais de cancelamento)
├── landing/ (LandingNavBar, LandingHeroSection, PricingSection, FeaturesSection, TestimonialsSection)
├── onboarding/ (OnboardingLayout)
├── system-admin/ (SystemAdminLayout, SystemAdminSidebar)
└── ui/ (61 componentes Shadcn/UI)
```

---

## FASE 2 — PROBLEMAS IDENTIFICADOS

### Legenda de Severidade
- 🔴 **ALTO** — Quebra o layout ou torna conteúdo ilegível/inacessível
- 🟡 **MÉDIO** — Degradação visual significativa em mobile/tablet
- 🟢 **BAIXO** — Polimento visual, melhora a experiência mas não quebra nada

---

## 2.1 Elementos Não Responsivos

### 🔴 ALTO

---

**[A-01] AdminAssinaturas.tsx — Grid forçado 2 colunas sem breakpoint**
- **Arquivo:** `src/pages/admin/AdminAssinaturas.tsx` ~L181
- **Código:** `<div className="grid grid-cols-2 gap-4 pt-2">`
- **Problema:** Força 2 colunas em todos os tamanhos, incluindo telas < 375px. Cards de plano ficam ilegíveis.
- **Correção sugerida:** `grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2`

---

**[A-02] AdminAssinaturas.tsx — Grid forçado 3 colunas sem breakpoint**
- **Arquivo:** `src/pages/admin/AdminAssinaturas.tsx` ~L605
- **Código:** `<div className="grid grid-cols-3 gap-3 mt-4">`
- **Problema:** 3 colunas fixas em mobile. Texto e números transbordam.
- **Correção sugerida:** `grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4`

---

**[A-03] AdminAssinaturas.tsx — Tabela sem scroll horizontal**
- **Arquivo:** `src/pages/admin/AdminAssinaturas.tsx` ~L754
- **Código:** `<Table>` sem container `overflow-x-auto`
- **Problema:** Tabela extravasa a viewport em mobile, criando scroll da página inteira.
- **Correção sugerida:** Envolver em `<div className="overflow-x-auto">`

---

**[A-04] AdminVehicles.tsx — Selects com largura fixa em px**
- **Arquivo:** `src/pages/admin/AdminVehicles.tsx` ~L635, L650
- **Código:** `className="w-[180px]"` e `className="w-[150px]"`
- **Problema:** Larguras fixas em px podem exceder o espaço disponível em mobile.
- **Correção sugerida:** `w-full sm:w-[180px]` e `w-full sm:w-[150px]`

---

**[A-05] AdminVehicles.tsx — Popover de filtro com largura fixa**
- **Arquivo:** `src/pages/admin/AdminVehicles.tsx` ~L668
- **Código:** `className="w-[220px]"`
- **Problema:** 220px pode exceder a largura da tela em smartphones.
- **Correção sugerida:** `w-full sm:w-[220px]`

---

**[A-06] AdminMessages.tsx — Altura do container fixa com calc()**
- **Arquivo:** `src/pages/admin/AdminMessages.tsx` ~L48
- **Código:** `const CHAT_CONTAINER_HEIGHT = 'h-[calc(100vh-120px)]'`
- **Problema:** Não considera teclado virtual, barra de endereço mobile, ou headers de tamanhos diferentes.
- **Correção sugerida:** Usar `dvh` (dynamic viewport height) ou ajuste por breakpoint.

---

**[A-07] AdminMessages.tsx — Sidebar com largura fixa 350px**
- **Arquivo:** `src/pages/admin/AdminMessages.tsx` ~L299
- **Código:** `className="w-full md:w-[350px]"`
- **Problema:** 350px de sidebar em tablet consome espaço demais para a área de chat.
- **Correção sugerida:** `w-full md:w-[280px] lg:w-[350px]`

---

**[A-08] Signup.tsx — Grid 3 colunas em mobile para seleção de tipo**
- **Arquivo:** `src/pages/auth/Signup.tsx` ~L357
- **Código:** `className="grid grid-cols-3 gap-2"`
- **Problema:** 3 colunas em telas < 360px; botões ficam comprimidos/ilegíveis.
- **Correção sugerida:** `grid grid-cols-1 sm:grid-cols-3 gap-2`

---

**[A-09] Signup.tsx — Grid de endereço com 2 colunas no mobile**
- **Arquivo:** `src/pages/auth/Signup.tsx` ~L462
- **Código:** `className="grid grid-cols-2 md:grid-cols-4 gap-4"`
- **Problema:** 2 colunas em mobile é muito estreito para campos de formulário (ex: número + complemento).
- **Correção sugerida:** `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4`

---

**[A-10] PublicInstructorMap.tsx — Popup com min-width fixo de 220px**
- **Arquivo:** `src/pages/PublicInstructorMap.tsx` ~L85
- **Código:** HTML inline: `<div style="min-width:220px;max-width:280px;">`
- **Problema:** Popup do mapa excede a largura de iPhones SE (320px) quando somado ao padding.
- **Correção sugerida:** `min-width:auto;max-width:calc(100vw - 32px)`

---

**[A-11] AdminSidebar.tsx — Sidebar sem comportamento de colapso mobile**
- **Arquivo:** `src/components/admin/AdminSidebar.tsx` ~L93
- **Código:** `aside className="fixed left-0 top-0 z-40 h-screen w-64"`
- **Problema:** Sidebar ocupa 256px em todas as telas; sem drawer/hamburger, bloqueia conteúdo em mobile.
- **Observação:** AdminLayout.tsx usa `lg:ml-[240px]` mas não há lógica de colapso para md/sm.

---

**[A-12] OnboardingLayout.tsx — Margem fixa sem colapso mobile**
- **Arquivo:** `src/components/onboarding/OnboardingLayout.tsx` ~L37
- **Código:** `className="ml-64"`
- **Problema:** Margem de 256px sem responsive; conteúdo fica fora da tela em mobile.
- **Correção sugerida:** Verificar se sidebar está oculta em mobile e remover margem correspondente.

---

**[A-13] SystemAdminLayout.tsx — Mesma questão de margem fixa**
- **Arquivo:** `src/components/system-admin/SystemAdminLayout.tsx` ~L37
- **Código:** `className="ml-64"`
- **Problema:** Idêntico ao OnboardingLayout — margem sem mobile responsive.

---

**[A-14] StudentMessages.tsx — Altura de container com calc() não mobile-safe**
- **Arquivo:** `src/pages/student/StudentMessages.tsx` ~L47
- **Código:** `const CHAT_CONTAINER_HEIGHT = 'h-[calc(100vh-4rem)]'`
- **Problema:** Não considera teclado virtual em mobile, resultando em overflow.

---

**[A-15] InstructorMap.tsx — h-screen não mobile-safe**
- **Arquivo:** `src/pages/student/InstructorMap.tsx` ~L214
- **Código:** `<div className="h-screen flex flex-col">`
- **Problema:** `h-screen` em mobile inclui a barra de endereço; usar `h-dvh` ou `min-h-dvh`.

---

### 🟡 MÉDIO

---

**[A-16] AdminInstrutores.tsx — Grid de stats pula de 2 para 4 colunas**
- **Arquivo:** `src/pages/admin/AdminInstrutores.tsx` ~L64
- **Código:** `className="grid grid-cols-2 lg:grid-cols-4 gap-4"`
- **Problema:** Sem breakpoint intermediário; tablets (600–900px) ficam com 2 colunas largas demais.
- **Correção sugerida:** `grid grid-cols-2 md:grid-cols-4 gap-4`

---

**[A-17] AdminDashboard.tsx — Grid pula para 12 colunas direto**
- **Arquivo:** `src/pages/admin/AdminDashboard.tsx` ~L95
- **Código:** `className="grid grid-cols-1 lg:grid-cols-12 gap-6"`
- **Problema:** Salto abrupto de 1 para 12 colunas sem breakpoint md.

---

**[A-18] AdminProfile.tsx — Layout 3 colunas sem breakpoint tablet**
- **Arquivo:** `src/pages/admin/AdminProfile.tsx` ~L397
- **Código:** `className="grid grid-cols-1 lg:grid-cols-3 gap-6"`
- **Problema:** Em tablet (768–1023px), permanece 1 coluna; espaço desperdiçado.
- **Correção sugerida:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

---

**[A-19] FilterSidebar.tsx — Sidebar sem breakpoint responsivo para tablets**
- **Arquivo:** `src/components/marketplace/FilterSidebar.tsx` ~L290
- **Código:** `hidden md:block w-72 lg:w-80`
- **Problema:** w-72 (288px) deixa pouco espaço para o conteúdo em tablets de 768px.
- **Correção sugerida:** `hidden md:block w-64 lg:w-72 xl:w-80`

---

**[A-20] InstructorProfile.tsx — Largura fixa de cards de veículo em scroll horizontal**
- **Arquivo:** `src/pages/InstructorProfile.tsx` ~L455
- **Código:** `className="shrink-0 w-56 ..."`
- **Problema:** w-56 (224px) em telas < 320px não cabe com padding lateral.
- **Correção sugerida:** `w-44 sm:w-48 md:w-56`

---

**[A-21] InstructorProfile.tsx — Imagens de mídia com tamanho fixo**
- **Arquivo:** `src/pages/InstructorProfile.tsx` ~L539
- **Código:** `className="shrink-0 w-36 h-36 ..."`
- **Problema:** Tamanho fixo de 144px não escala para telas muito pequenas.
- **Correção sugerida:** `w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36`

---

**[A-22] AdminAppointments.tsx — Tabs horizontais sem overflow-x-auto**
- **Arquivo:** `src/pages/admin/AdminAppointments.tsx` ~L421
- **Código:** `<TabsList>` com múltiplas tabs sem wrapper `overflow-x-auto`
- **Problema:** Tabs podem ser cortadas em mobile.

---

**[A-23] JornadaCNH.tsx — TabsList com 5 colunas em mobile**
- **Arquivo:** `src/pages/student/JornadaCNH.tsx` ~L143
- **Código:** `className="w-full grid grid-cols-5 h-auto"`
- **Problema:** 5 colunas são muito comprimidas em telas < 400px; texto fica ilegível.
- **Correção sugerida:** `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5` ou usar scroll horizontal.

---

**[A-24] JornadaCNH.tsx — min-height excessivo em mobile**
- **Arquivo:** `src/pages/student/JornadaCNH.tsx` ~L161
- **Código:** `className="mt-6 min-h-[500px] lg:min-h-[600px]"`
- **Problema:** 500px de min-height em mobile força scroll desnecessário.
- **Correção sugerida:** Remover min-height em mobile ou usar `min-h-0 md:min-h-[400px] lg:min-h-[600px]`

---

**[A-25] DadosBasicos.tsx (onboarding) — Grid 2 colunas em mobile para campos de endereço**
- **Arquivo:** `src/pages/onboarding/DadosBasicos.tsx` ~L462
- **Código:** `className="grid grid-cols-2 md:grid-cols-4 gap-4"`
- **Problema:** Mesma questão do Signup; 2 colunas em mobile é estreito demais.

---

**[A-26] Marketplace.tsx — Modal com altura fixa 85vh**
- **Arquivo:** `src/pages/Marketplace.tsx` ~L210
- **Código:** `<SheetContent side="bottom" className="h-[85vh] ..."`
- **Problema:** 85vh em landscape mobile pode extrapolar a tela disponível.
- **Correção sugerida:** `h-[70vh] sm:h-[85vh]`

---

**[A-27] InstructorProfile.tsx — min-height de container desnecessariamente grande**
- **Arquivo:** `src/pages/InstructorProfile.tsx` ~L579
- **Código:** `<div className="min-h-[600px]">`
- **Problema:** 600px de min-height em mobile causa scroll extra desnecessário.
- **Correção sugerida:** `min-h-[300px] sm:min-h-[400px] md:min-h-[600px]`

---

**[A-28] BookingDetailsModal.tsx — Grid 2 colunas sem responsive**
- **Arquivo:** `src/components/admin/BookingDetailsModal.tsx` ~L226
- **Código:** `className="grid grid-cols-2 gap-4"`
- **Problema:** 2 colunas forçadas em mobile dentro de modal.
- **Correção sugerida:** `grid grid-cols-1 sm:grid-cols-2 gap-4`

---

**[A-29] VehicleModal.tsx — Grid de fotos 2 colunas em mobile**
- **Arquivo:** `src/components/admin/VehicleModal.tsx` ~L456
- **Código:** `className="grid grid-cols-2 md:grid-cols-3 gap-3"`
- **Problema:** Em telas < 375px, 2 colunas de fotos ficam muito pequenas.

---

**[A-30] UserProfile.tsx — Grid pula de 1 para 3 colunas sem md**
- **Arquivo:** `src/pages/UserProfile.tsx` ~L495
- **Código:** `className="grid grid-cols-1 lg:grid-cols-3 gap-6"`
- **Problema:** Tablets com lg:grid-cols-3 sem md:grid-cols-2 desperdiçam espaço.
- **Correção sugerida:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

---

**[A-31] ProfileHeader.tsx — Altura de banner sem breakpoint sm**
- **Arquivo:** `src/components/profile/ProfileHeader.tsx` ~L46
- **Código:** `className="h-[320px] md:h-[400px] lg:h-[450px]"`
- **Problema:** Sem breakpoint sm; em phones (< 640px) o banner de 320px pode ser excessivo.
- **Correção sugerida:** `h-[200px] sm:h-[280px] md:h-[400px] lg:h-[450px]`

---

### 🟢 BAIXO

---

**[A-32] NotFound.tsx — Padding lateral ausente**
- **Arquivo:** `src/pages/NotFound.tsx` ~L14
- **Código:** `<div className="flex min-h-screen items-center justify-center bg-muted">`
- **Problema:** Sem px-4; texto pode tocar as bordas da tela em mobile.
- **Correção sugerida:** Adicionar `px-4`

---

**[A-33] PersonalizarDashboard.tsx — Grid de temas sem breakpoint sm**
- **Arquivo:** `src/pages/admin/PersonalizarDashboard.tsx` ~L119
- **Código:** `className="grid grid-cols-2 md:grid-cols-3 gap-3"`
- **Problema:** Pula de 2 para 3 colunas; poderia ter sm:grid-cols-2 explícito.

---

**[A-34] LandingHeroSection.tsx — Grid sem breakpoint md para tablet**
- **Arquivo:** `src/components/landing/LandingHeroSection.tsx` ~L17
- **Código:** `className="grid lg:grid-cols-2 gap-12 lg:gap-16"`
- **Problema:** Em tablet (768–1023px), layout permanece em 1 coluna; oportunidade perdida de 2 colunas.

---

**[A-35] LandingHeroSection.tsx — Elementos flutuantes com posição absoluta negativa**
- **Arquivo:** `src/components/landing/LandingHeroSection.tsx` ~L132, L149
- **Código:** `absolute -left-8` e `absolute -right-8`
- **Problema:** Podem criar scroll horizontal ou overflow em telas pequenas.

---

## 2.2 Texto Não Responsivo

### 🔴 ALTO

---

**[T-01] ProfileHeader.tsx — Título com text-5xl sem breakpoint sm**
- **Arquivo:** `src/components/profile/ProfileHeader.tsx` ~L82
- **Código:** `className="text-3xl md:text-4xl lg:text-5xl"`
- **Problema:** Em telas < 375px, text-3xl (1.875rem) pode extravasar ou quebrar layout.
- **Correção sugerida:** `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`

---

**[T-02] LandingHeroSection.tsx — Texto heroico muito grande em mobile**
- **Arquivo:** `src/components/landing/LandingHeroSection.tsx` ~L36
- **Código:** `className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl"`
- **Problema:** text-4xl (2.25rem) em mobile ocupa muito espaço vertical em telas < 375px.
- **Correção sugerida:** `text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl`

---

### 🟡 MÉDIO

---

**[T-03] NotFound.tsx — Texto sem responsividade**
- **Arquivo:** `src/pages/NotFound.tsx` ~L14
- **Código:** `<h1 className="mb-4 text-4xl font-bold">` e `<p className="mb-4 text-xl">`
- **Problema:** text-4xl e text-xl fixos sem variantes sm.
- **Correção sugerida:** `text-3xl sm:text-4xl` e `text-lg sm:text-xl`

---

**[T-04] InstructorMap.tsx — Título sem variante mobile**
- **Arquivo:** `src/pages/student/InstructorMap.tsx` ~L219
- **Código:** `<h1 className="text-2xl font-bold">Mapa de Instrutores</h1>`
- **Problema:** text-2xl fixo; poderia usar `text-xl sm:text-2xl`.

---

**[T-05] OnboardingStart.tsx — Título sem variante sm**
- **Arquivo:** `src/pages/onboarding/OnboardingStart.tsx` ~L82
- **Código:** `className="text-3xl md:text-4xl"`
- **Problema:** Pula de 3xl para 4xl sem sm.
- **Correção sugerida:** `text-2xl sm:text-3xl md:text-4xl`

---

## 2.3 Texto Sem Quebra / Overflow

### 🔴 ALTO

---

**[O-01] StudentFavorites.tsx — Localização do instrutor sem truncate**
- **Arquivo:** `src/pages/student/StudentFavorites.tsx` ~L178
- **Código:** `{instructor.location}` sem truncate/line-clamp
- **Problema:** Nome de cidade longo pode extrapolar o card em mobile.
- **Correção sugerida:** Adicionar `<span className="truncate">`

---

**[O-02] StudentRefunds.tsx — Nome do instrutor sem truncate**
- **Arquivo:** `src/pages/student/StudentRefunds.tsx` ~L94
- **Código:** `Aula com {instructorName}` sem truncate
- **Problema:** Nome longo quebra layout em mobile.
- **Correção sugerida:** Adicionar `truncate` ou `line-clamp-1`

---

**[O-03] LessonCard.tsx — Nome do instrutor sem truncate**
- **Arquivo:** `src/components/student/LessonCard.tsx` ~L177
- **Código:** `<h3 className="font-semibold text-foreground text-lg">{lesson.instructorName}</h3>`
- **Problema:** Sem line-clamp; nome longo empurra outros elementos.
- **Correção sugerida:** Adicionar `line-clamp-1` ou `truncate`

---

**[O-04] AdminReviews.tsx — Nome/email do autor sem truncate**
- **Arquivo:** `src/pages/admin/AdminReviews.tsx` ~L413
- **Código:** Nome e email do revisor sem truncate
- **Problema:** Dados dinâmicos longos podem extrapolar cards.
- **Correção sugerida:** Adicionar `truncate` nos campos de nome e email

---

**[O-05] AdminMessages.tsx — Balloon de mensagem com max-w fixo**
- **Arquivo:** `src/pages/admin/AdminMessages.tsx` ~L516
- **Código:** `className="max-w-[70%] px-4 py-2 rounded-2xl shadow-sm"`
- **Problema:** Em telas muito pequenas (< 320px), 70% do viewport pode ser estreito demais para o texto interno.

---

**[O-06] AdminMedia.tsx — Nome de arquivo com max-width fixo**
- **Arquivo:** `src/pages/admin/AdminMedia.tsx` ~L691
- **Código:** `className="text-foreground text-sm font-medium truncate max-w-[200px]"`
- **Problema:** max-w-[200px] não escala com a tela; poderia ser `max-w-full` com truncate.

---

### 🟡 MÉDIO

---

**[O-07] Settings.tsx — Cartões de afiliação sem flex-col em mobile**
- **Arquivo:** `src/pages/Settings.tsx` ~L413
- **Código:** `className="flex items-center justify-between gap-3 p-3 ..."`
- **Problema:** Com nome de escola longo, o botão pode ser empurrado para fora.
- **Correção sugerida:** `flex flex-col sm:flex-row items-start sm:items-center justify-between`

---

**[O-08] VerifyEmail.tsx — Email sem quebra de texto**
- **Arquivo:** `src/pages/auth/VerifyEmail.tsx` ~L248
- **Código:** Email exibido sem `break-all` ou `truncate`
- **Problema:** Emails longos (ex: muito.longo@empresa.com.br) podem extrapolar o container.
- **Correção sugerida:** Adicionar `break-all` ou `overflow-wrap: anywhere`

---

**[O-09] InstructorCard.tsx — min-width fixo em seção de nome**
- **Arquivo:** `src/components/marketplace/InstructorCard.tsx` ~L36
- **Código:** `min-w-[140px]` na seção de identidade
- **Problema:** Nomes longos transbordam sem limitar overflow.

---

**[O-10] PendingInstructors.tsx — Badges de documentos sem wrapping controlado**
- **Arquivo:** `src/pages/system-admin/PendingInstructors.tsx` ~L250
- **Código:** `flex gap` em badges sem `flex-wrap` explícito
- **Problema:** Em telas estreitas, badges podem extrapolar o card.
- **Correção sugerida:** Garantir `flex-wrap` no container de badges

---

## 2.4 Imagens e Mídia

### 🟡 MÉDIO

---

**[I-01] AdminProfile.tsx — Foto de perfil com tamanho fixo w-32 h-32**
- **Arquivo:** `src/pages/admin/AdminProfile.tsx` ~L468
- **Código:** `className="w-32 h-32 rounded-full"`
- **Problema:** Sem variante responsiva; em mobile pode ser grande demais.
- **Correção sugerida:** `w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32`

---

**[I-02] ProfileHeader.tsx — Foto de perfil sem breakpoint sm**
- **Arquivo:** `src/components/profile/ProfileHeader.tsx` ~L64
- **Código:** `className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40"`
- **Problema:** Sem variante sm; pulo direto de 112px para 144px em md.

---

**[I-03] AdminProfile.tsx / UserProfile.tsx — Drop zone de upload com altura fixa**
- **Arquivo:** `src/pages/admin/AdminProfile.tsx` ~L778, `src/pages/UserProfile.tsx` ~L938
- **Código:** `className="w-full h-48 border-2 border-dashed..."`
- **Problema:** 192px fixos desnecessariamente grandes em mobile.
- **Correção sugerida:** `h-36 sm:h-40 md:h-48`

---

**[I-04] SchoolFinancialDashboard.tsx — Containers de gráficos com altura fixa**
- **Arquivo:** `src/pages/admin/SchoolFinancialDashboard.tsx` ~L272, L299
- **Código:** `<div className="h-[200px] md:h-[300px]">`
- **Problema:** Sem overflow; gráficos Recharts podem ser cortados em telas muito pequenas.

---

## 2.5 Inputs e Formulários

### 🟡 MÉDIO

---

**[F-01] Settings.tsx — Input de senha com botão absolutamente posicionado**
- **Arquivo:** `src/pages/Settings.tsx` ~L214
- **Código:** Botão `absolute right-0 top-0 h-full px-3` sobre o input
- **Problema:** Em telas estreitas, ícone pode sobrepor o texto digitado se o input não tiver `pr-10`.
- **Correção sugerida:** Garantir `pr-10` ou `pr-12` no input correspondente

---

**[F-02] AdminCalendario.tsx — Select com largura fixa quebrando em sm**
- **Arquivo:** `src/pages/admin/AdminCalendario.tsx` ~L67
- **Código:** `className="w-full sm:w-64"`
- **Problema:** Transição abrupta de full-width para 256px fixo.

---

**[F-03] DadosBasicos.tsx — Seção de foto sem flex-col em mobile**
- **Arquivo:** `src/pages/onboarding/DadosBasicos.tsx` ~L322
- **Código:** `className="flex items-center gap-6"`
- **Problema:** Foto e campos de texto ficam lado a lado; em mobile deveria ser `flex-col sm:flex-row`.

---

**[F-04] Signup.tsx — State/City grid 2 colunas sem responsive**
- **Arquivo:** `src/pages/auth/Signup.tsx` ~L555
- **Código:** `className="grid grid-cols-2 gap-3"`
- **Problema:** 2 colunas em mobile pode ser estreito para inputs de estado e cidade.
- **Correção sugerida:** `grid grid-cols-1 sm:grid-cols-2 gap-3`

---

## 2.6 Modais e Overlays

### 🔴 ALTO

---

**[M-01] CancelPaidLessonModal.tsx — Modal sem max-height**
- **Arquivo:** `src/components/student/CancelPaidLessonModal.tsx` ~L44
- **Código:** `className="... w-full max-w-md bg-card rounded-2xl ... overflow-hidden"`
- **Problema:** Sem `max-h-[90vh]` e `overflow-y-auto`; em telas pequenas o modal pode extrapolar a viewport.
- **Correção sugerida:** Adicionar `max-h-[90vh] overflow-y-auto`

---

**[M-02] NoShowReportModal.tsx — Modal sem max-height**
- **Arquivo:** `src/components/student/NoShowReportModal.tsx` ~L42
- **Código:** Idêntico ao CancelPaidLessonModal — falta `max-h-[90vh] overflow-y-auto`

---

**[M-03] RefundRequestModal.tsx — Modal sem max-height**
- **Arquivo:** `src/components/student/RefundRequestModal.tsx` ~L50
- **Código:** Idêntico — falta `max-h-[90vh] overflow-y-auto`

---

**[M-04] AdminMedia.tsx — Dialog sem padding responsivo em mobile**
- **Arquivo:** `src/pages/admin/AdminMedia.tsx` ~L747
- **Código:** `DialogContent` com `max-w-lg` sem padding responsivo
- **Problema:** Em mobile, modal pode tocar as bordas da tela.
- **Correção sugerida:** Garantir `mx-4` ou `sm:mx-0` no DialogContent

---

### 🟡 MÉDIO

---

**[M-05] BookingDetailsModal.tsx — max-w-2xl sem ajuste para tablet**
- **Arquivo:** `src/components/admin/BookingDetailsModal.tsx` ~L145
- **Código:** `className="w-full max-w-2xl max-h-[85vh] overflow-hidden"`
- **Problema:** max-w-2xl (672px) pode ser excessivo em tablets de 768px.

---

**[M-06] VehicleModal.tsx — Dialog com max-w-2xl sem responsividade**
- **Arquivo:** `src/components/admin/VehicleModal.tsx` ~L312
- **Código:** `max-w-2xl max-h-[90vh] overflow-y-auto`
- **Problema:** Mesma questão; poderia usar `max-w-xl sm:max-w-2xl`

---

**[M-07] StudentLessons.tsx — DialogContent sem altura mínima garantida em mobile**
- **Arquivo:** `src/pages/student/StudentLessons.tsx` ~L674
- **Código:** `className="sm:max-w-lg max-h-[90vh] overflow-y-auto"`
- **Problema:** Sem `sm:` na altura; em extra-small pode não ter espaço suficiente.

---

## 2.7 Navegação

### 🔴 ALTO

---

**[N-01] AdminSidebar.tsx — Sem hamburger/drawer para mobile**
- **Arquivo:** `src/components/admin/AdminSidebar.tsx`
- **Problema:** Sidebar fixa em 256px sem mecanismo de colapso. Em telas < 1024px, bloqueia o conteúdo principal ou desaparece sem substituição. Não há botão hamburger no AdminHeader para acionar a sidebar em mobile.
- **Impacto:** Admin panel inacessível em mobile/tablet.

---

**[N-02] StudentHeader.tsx — Menu mobile sem overflow-y-auto**
- **Arquivo:** `src/components/student/StudentHeader.tsx` ~L143
- **Código:** `{mobileMenuOpen && <div className="md:hidden py-4 border-t...">}`
- **Problema:** Menu mobile sem `max-h-[calc(100vh-64px)] overflow-y-auto`; com muitos itens, extrapola a tela.

---

### 🟡 MÉDIO

---

**[N-03] AdminAppointments.tsx — Tabs sem overflow-x-auto em mobile**
- **Arquivo:** `src/pages/admin/AdminAppointments.tsx` ~L421
- **Problema:** TabsList horizontal pode ser cortado em mobile sem scroll.
- **Correção sugerida:** Envolver em `<div className="overflow-x-auto">` ou usar `ScrollArea`.

---

**[N-04] JornadaCNH.tsx — 5 tabs sem scroll horizontal**
- **Arquivo:** `src/pages/student/JornadaCNH.tsx` ~L143
- **Problema:** 5 tabs comprimidas; alternativa: `overflow-x-auto` no container.

---

---

## FASE 3 — RESUMO EXECUTIVO

### Contagem por Severidade

| Severidade | Qtd | Categorias Afetadas |
|-----------|-----|---------------------|
| 🔴 Alto   | 22  | Grids sem breakpoint, sidebars sem colapso, modais sem max-height, h-screen mobile |
| 🟡 Médio  | 28  | Textos sem truncate, tamanhos de imagem, formulários, grids de tablet |
| 🟢 Baixo  | 7   | Padding, tipografia, detalhes de polimento |
| **Total** | **57** | |

### Top 10 Problemas Críticos (por impacto)

| # | ID | Arquivo | Problema |
|---|----|---------|----------|
| 1 | N-01 | AdminSidebar.tsx | Sidebar sem colapso mobile — admin inacessível |
| 2 | A-11 | AdminSidebar.tsx + AdminLayout.tsx | Margem fixa ml-64 sem responsividade |
| 3 | A-08 | Signup.tsx | Grid 3 colunas esmagadas em mobile |
| 4 | A-03 | AdminAssinaturas.tsx | Tabela sem scroll horizontal |
| 5 | A-14 | StudentMessages.tsx | Chat height com calc() não mobile-safe |
| 6 | A-15 | InstructorMap.tsx | h-screen não mobile-safe |
| 7 | M-01/02/03 | Modais estudante | 3 modais sem max-height |
| 8 | A-10 | PublicInstructorMap.tsx | Popup com min-width 220px extrapola iPhone SE |
| 9 | A-06 | AdminMessages.tsx | Container de chat com altura fixa |
| 10 | A-23 | JornadaCNH.tsx | 5 tabs ilegíveis em mobile |

### Arquivos com Mais Problemas

| Arquivo | Issues | Severidade Máx |
|---------|--------|----------------|
| AdminAssinaturas.tsx | 4 | 🔴 Alto |
| AdminMessages.tsx | 3 | 🔴 Alto |
| AdminVehicles.tsx | 4 | 🔴 Alto |
| InstructorProfile.tsx | 5 | 🟡 Médio |
| AdminSidebar.tsx + AdminLayout.tsx | 2 | 🔴 Alto |
| JornadaCNH.tsx | 4 | 🟡 Médio |
| Signup.tsx | 4 | 🔴 Alto |
| StudentMessages.tsx | 3 | 🔴 Alto |
| ProfileHeader.tsx | 3 | 🔴 Alto |

### Padrões Recorrentes (Quick Wins)

1. **Tabelas sem `overflow-x-auto`** — buscar todos os `<Table>` e envolver no container
2. **Modais sem `max-h-[90vh] overflow-y-auto`** — buscar todos os custom modals (não Shadcn Dialog)
3. **Grids sem breakpoint sm** — buscar `grid-cols-[2-9]` sem `sm:grid-cols-1`
4. **Textos dinâmicos sem truncate** — buscar renderizações de `{name}`, `{email}`, `{location}` em cards
5. **`h-screen` / `calc(100vh-X)`** — substituir por `h-dvh` ou `min-h-dvh`
6. **`ml-64` sem responsive** — todos os layouts com sidebar precisam de `lg:ml-64`
