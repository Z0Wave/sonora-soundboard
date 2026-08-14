# Sonora Soundboard

O Sonora é um aplicativo de soundboard nativo e de alta performance, desenvolvido especificamente para a comunidade Continental. 

Construído para ser robusto, leve e altamente escalável, o Sonora permite aos usuários gerenciar perfis de áudio personalizados, configurar atalhos de teclado globais e rotear áudio por meio de cabos virtuais para integração perfeita com aplicativos de VOIP (como Discord) ou chats de voz em jogos. O aplicativo oferece recursos profissionais de roteamento de áudio sem o alto consumo de recursos típico de aplicações baseadas em Electron.

## Principais Recursos

* **Motor de Macros Global:** Atribua qualquer som a uma combinação de teclado global. O aplicativo intercepta os comandos a nível de sistema operacional, garantindo execução com zero latência, mesmo quando minimizado ou em segundo plano.
* **Roteamento de Áudio Virtual:** Selecione dispositivos de saída específicos, físicos ou virtuais (como o VB-Cable), para direcionar o áudio do soundboard diretamente para a entrada de outros softwares.
* **Monitoramento de Áudio Local:** Ative ou desative o retorno local (ouvir a si mesmo) e ajuste o volume do monitoramento independentemente da saída principal do aplicativo.
* **Atualizações Over-The-Air (OTA):** Sistema integrado de entrega automatizada de atualizações em segundo plano, garantindo que os usuários tenham sempre as correções e recursos mais recentes de forma transparente.
* **Gerenciamento de Perfis:** Crie, edite e alterne entre diferentes grids de soundboard para variados cenários (ex: jogos diferentes, streaming ou podcasts).
* **Processamento de Áudio Integrado:** Capacidade nativa para cortar segmentos específicos de um arquivo de áudio e normalizar o volume antes de salvá-lo no grid.
* **Integração com o Sistema:** Inclui um "Botão de Pânico" global personalizável para interromper instantaneamente todos os áudios ativos, além de execução opcional em segundo plano e inicialização automática com o sistema operacional.

## Arquitetura

O Sonora conecta um backend rápido e de baixo nível escrito em Rust com um frontend moderno em React por meio do framework Tauri. 

A base de código segue uma rigorosa Arquitetura Baseada em Funcionalidades (Domain-Driven Design). A interface de usuário (UI) é completamente desacoplada do backend por meio de uma camada dedicada de infraestrutura e serviços, evitando "Componentes Deus" (God objects) e garantindo escalabilidade extrema para futuras atualizações.

### Stack Tecnológico

**Frontend:**
* React (Vite)
* TypeScript
* Zustand (Gerenciamento de Estado)
* React Router DOM (Roteamento)
* Tailwind CSS (Estilização)

**Backend & Sistema:**
* Rust
* Tauri Framework (v2)
* SQLite (Banco de Dados Local)
* Plugins a nível de OS (Atalhos Globais, Inicialização Automática, Atualizador)

## Configuração de Desenvolvimento

Para executar este projeto localmente, certifique-se de ter o Node.js (v18+) e a toolchain do Rust instalados em seu sistema.

1. Clone este repositório para sua máquina local:
```bash
git clone https://github.com/Z0Wave/sonora-soundboard.git
```

2. Navegue até o diretório do projeto e instale as dependências:
```bash
cd sonora-soundboard
npm install
```

3. Execute o ambiente de desenvolvimento (compila o backend em Rust e inicia o aplicativo):
```bash
npm run tauri dev
```

4. Compile para produção (gera o instalador final e as assinaturas OTA):
```bash
npm run tauri build
```

## Licença e Créditos

Desenvolvido de forma independente, para e com a comunidade Continental.