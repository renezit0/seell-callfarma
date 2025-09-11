export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      arquivos: {
        Row: {
          caminho: string
          data_upload: string | null
          id: number
          mime_type: string
          nome_arquivo: string
          status: string | null
          tamanho: number
          tipo: Database["public"]["Enums"]["arquivo_tipo"]
          usuario_id: number | null
        }
        Insert: {
          caminho: string
          data_upload?: string | null
          id?: number
          mime_type: string
          nome_arquivo: string
          status?: string | null
          tamanho: number
          tipo?: Database["public"]["Enums"]["arquivo_tipo"]
          usuario_id?: number | null
        }
        Update: {
          caminho?: string
          data_upload?: string | null
          id?: number
          mime_type?: string
          nome_arquivo?: string
          status?: string | null
          tamanho?: number
          tipo?: Database["public"]["Enums"]["arquivo_tipo"]
          usuario_id?: number | null
        }
        Relationships: []
      }
      balanco_datas: {
        Row: {
          created_at: string | null
          data_balanco: string
          id: number
          loja_id: number
          observacao: string | null
          tipo_balanco: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_balanco: string
          id?: number
          loja_id: number
          observacao?: string | null
          tipo_balanco: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_balanco?: string
          id?: number
          loja_id?: number
          observacao?: string | null
          tipo_balanco?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "balanco_datas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      bancos: {
        Row: {
          data_atualizacao: string | null
          data_criacao: string | null
          id: number
          nome: string
          status: Database["public"]["Enums"]["banco_status"] | null
        }
        Insert: {
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: number
          nome: string
          status?: Database["public"]["Enums"]["banco_status"] | null
        }
        Update: {
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: number
          nome?: string
          status?: Database["public"]["Enums"]["banco_status"] | null
        }
        Relationships: []
      }
      campanha_config: {
        Row: {
          campanha_id: number
          chave: string
          id: number
          valor: string | null
        }
        Insert: {
          campanha_id: number
          chave: string
          id?: number
          valor?: string | null
        }
        Update: {
          campanha_id?: number
          chave?: string
          id?: number
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanha_config_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_historico: {
        Row: {
          alterado_por: number
          campanha_id: number
          data_alteracao: string | null
          id: number
          loja_id: number
          valor_anterior: number | null
          valor_novo: number
        }
        Insert: {
          alterado_por: number
          campanha_id: number
          data_alteracao?: string | null
          id?: number
          loja_id: number
          valor_anterior?: number | null
          valor_novo: number
        }
        Update: {
          alterado_por?: number
          campanha_id?: number
          data_alteracao?: string | null
          id?: number
          loja_id?: number
          valor_anterior?: number | null
          valor_novo?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_historico_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_historico_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_lancamentos: {
        Row: {
          campanha_id: number
          data_lancamento: string | null
          id: number
          lancado_por: number
          loja_id: number
          valor_realizado: number
        }
        Insert: {
          campanha_id: number
          data_lancamento?: string | null
          id?: number
          lancado_por: number
          loja_id: number
          valor_realizado: number
        }
        Update: {
          campanha_id?: number
          data_lancamento?: string | null
          id?: number
          lancado_por?: number
          loja_id?: number
          valor_realizado?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_lancamentos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_lancamentos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_metas: {
        Row: {
          campanha_id: number
          id: number
          loja_id: number
          valor_meta: number
        }
        Insert: {
          campanha_id: number
          id?: number
          loja_id: number
          valor_meta: number
        }
        Update: {
          campanha_id?: number
          id?: number
          loja_id?: number
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_metas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_metas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          criado_por: number
          data_atualizacao: string | null
          data_criacao: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: number
          meta_total: number | null
          nome: string
          sem_metas: boolean | null
          status: Database["public"]["Enums"]["campanha_status"] | null
          tipo_campanha: Database["public"]["Enums"]["campanha_tipo"]
          valor_meta: number | null
        }
        Insert: {
          criado_por: number
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: number
          meta_total?: number | null
          nome: string
          sem_metas?: boolean | null
          status?: Database["public"]["Enums"]["campanha_status"] | null
          tipo_campanha?: Database["public"]["Enums"]["campanha_tipo"]
          valor_meta?: number | null
        }
        Update: {
          criado_por?: number
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: number
          meta_total?: number | null
          nome?: string
          sem_metas?: boolean | null
          status?: Database["public"]["Enums"]["campanha_status"] | null
          tipo_campanha?: Database["public"]["Enums"]["campanha_tipo"]
          valor_meta?: number | null
        }
        Relationships: []
      }
      campanhas_lojas: {
        Row: {
          campanha_id: number
          id: number
          loja_id: number
          realizado: number | null
          status: Database["public"]["Enums"]["campanha_status"] | null
        }
        Insert: {
          campanha_id: number
          id?: number
          loja_id: number
          realizado?: number | null
          status?: Database["public"]["Enums"]["campanha_status"] | null
        }
        Update: {
          campanha_id?: number
          id?: number
          loja_id?: number
          realizado?: number | null
          status?: Database["public"]["Enums"]["campanha_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_lojas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_lojas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_lojas_historico: {
        Row: {
          campanha_loja_id: number
          data_registro: string
          id: number
          registrado_por: number
          valor_anterior: number | null
          valor_novo: number
        }
        Insert: {
          campanha_loja_id: number
          data_registro: string
          id?: number
          registrado_por: number
          valor_anterior?: number | null
          valor_novo: number
        }
        Update: {
          campanha_loja_id?: number
          data_registro?: string
          id?: number
          registrado_por?: number
          valor_anterior?: number | null
          valor_novo?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_lojas_historico_campanha_loja_id_fkey"
            columns: ["campanha_loja_id"]
            isOneToOne: false
            referencedRelation: "campanhas_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_vendas_lojas: {
        Row: {
          criado_por: number | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          familias: number | null
          fornecedores: number | null
          grupos_produtos: number[] | null
          id: number
          marcas: number | null
          nome: string | null
          produtos: string | null
          sem_metas: string | null
          status: string | null
          tipo_meta: string | null
        }
        Insert: {
          criado_por?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          familias?: number | null
          fornecedores?: number | null
          grupos_produtos?: number[] | null
          id: number
          marcas?: number | null
          nome?: string | null
          produtos?: string | null
          sem_metas?: string | null
          status?: string | null
          tipo_meta?: string | null
        }
        Update: {
          criado_por?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          familias?: number | null
          fornecedores?: number | null
          grupos_produtos?: number[] | null
          id?: number
          marcas?: number | null
          nome?: string | null
          produtos?: string | null
          sem_metas?: string | null
          status?: string | null
          tipo_meta?: string | null
        }
        Relationships: []
      }
      campanhas_vendas_lojas_participantes: {
        Row: {
          campanha_id: number | null
          codigo_loja: number | null
          data_inicio_participacao: string | null
          grupo_id: string | null
          id: number
          loja_id: number | null
          meta_quantidade: number | null
          meta_valor: number | null
          observacoes: string | null
          realizado_quantidade: number | null
          realizado_valor: number | null
          status: string | null
        }
        Insert: {
          campanha_id?: number | null
          codigo_loja?: number | null
          data_inicio_participacao?: string | null
          grupo_id?: string | null
          id: number
          loja_id?: number | null
          meta_quantidade?: number | null
          meta_valor?: number | null
          observacoes?: string | null
          realizado_quantidade?: number | null
          realizado_valor?: number | null
          status?: string | null
        }
        Update: {
          campanha_id?: number | null
          codigo_loja?: number | null
          data_inicio_participacao?: string | null
          grupo_id?: string | null
          id?: number
          loja_id?: number | null
          meta_quantidade?: number | null
          meta_valor?: number | null
          observacoes?: string | null
          realizado_quantidade?: number | null
          realizado_valor?: number | null
          status?: string | null
        }
        Relationships: []
      }
      config_salario: {
        Row: {
          atualizado_por: number
          bonus_fixo: number | null
          criado_por: number
          data_atualizacao: string
          data_criacao: string
          desconto_fixo: number | null
          id: number
          salario_base: number | null
          usuario_id: number
        }
        Insert: {
          atualizado_por: number
          bonus_fixo?: number | null
          criado_por: number
          data_atualizacao: string
          data_criacao: string
          desconto_fixo?: number | null
          id?: number
          salario_base?: number | null
          usuario_id: number
        }
        Update: {
          atualizado_por?: number
          bonus_fixo?: number | null
          criado_por?: number
          data_atualizacao?: string
          data_criacao?: string
          desconto_fixo?: number | null
          id?: number
          salario_base?: number | null
          usuario_id?: number
        }
        Relationships: []
      }
      config_salario_tipo: {
        Row: {
          atualizado_por: number
          bonus_fixo: number | null
          criado_por: number
          data_atualizacao: string
          data_criacao: string
          desconto_fixo: number | null
          id: number
          salario_base: number | null
          tipo_usuario: string
        }
        Insert: {
          atualizado_por: number
          bonus_fixo?: number | null
          criado_por: number
          data_atualizacao: string
          data_criacao: string
          desconto_fixo?: number | null
          id?: number
          salario_base?: number | null
          tipo_usuario: string
        }
        Update: {
          atualizado_por?: number
          bonus_fixo?: number | null
          criado_por?: number
          data_atualizacao?: string
          data_criacao?: string
          desconto_fixo?: number | null
          id?: number
          salario_base?: number | null
          tipo_usuario?: string
        }
        Relationships: []
      }
      correcoes_ponto: {
        Row: {
          data: string
          data_atualizacao: string | null
          data_criacao: string
          id: number
          observacao: string | null
          relatorio_id: number
          status: Database["public"]["Enums"]["correcao_status"]
          tipo: Database["public"]["Enums"]["correcao_tipo"]
          usuario_id: number
          valor_corrigido: string | null
          valor_original: string | null
        }
        Insert: {
          data: string
          data_atualizacao?: string | null
          data_criacao: string
          id?: number
          observacao?: string | null
          relatorio_id: number
          status?: Database["public"]["Enums"]["correcao_status"]
          tipo: Database["public"]["Enums"]["correcao_tipo"]
          usuario_id: number
          valor_corrigido?: string | null
          valor_original?: string | null
        }
        Update: {
          data?: string
          data_atualizacao?: string | null
          data_criacao?: string
          id?: number
          observacao?: string | null
          relatorio_id?: number
          status?: Database["public"]["Enums"]["correcao_status"]
          tipo?: Database["public"]["Enums"]["correcao_tipo"]
          usuario_id?: number
          valor_corrigido?: string | null
          valor_original?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correcoes_ponto_relatorio_id_fkey"
            columns: ["relatorio_id"]
            isOneToOne: false
            referencedRelation: "relatorios_ponto"
            referencedColumns: ["id"]
          },
        ]
      }
      depositos: {
        Row: {
          banco_id: number | null
          data_atualizacao: string | null
          data_criacao: string
          data_deposito: string | null
          data_movimento: string
          diferenca: number
          hora_deposito: string | null
          id: number
          loja_id: number
          matfun_id: string | null
          observacao: string | null
          usuario_id: number
          valor_a_depositar: number
          valor_ajuste: number | null
          valor_apos_ajuste: number
          valor_depositado: number
        }
        Insert: {
          banco_id?: number | null
          data_atualizacao?: string | null
          data_criacao: string
          data_deposito?: string | null
          data_movimento: string
          diferenca?: number
          hora_deposito?: string | null
          id?: number
          loja_id: number
          matfun_id?: string | null
          observacao?: string | null
          usuario_id: number
          valor_a_depositar?: number
          valor_ajuste?: number | null
          valor_apos_ajuste?: number
          valor_depositado?: number
        }
        Update: {
          banco_id?: number | null
          data_atualizacao?: string | null
          data_criacao?: string
          data_deposito?: string | null
          data_movimento?: string
          diferenca?: number
          hora_deposito?: string | null
          id?: number
          loja_id?: number
          matfun_id?: string | null
          observacao?: string | null
          usuario_id?: number
          valor_a_depositar?: number
          valor_ajuste?: number | null
          valor_apos_ajuste?: number
          valor_depositado?: number
        }
        Relationships: [
          {
            foreignKeyName: "depositos_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depositos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_ajustes_automaticos: {
        Row: {
          ativo: boolean
          created_at: string | null
          id: number
          loja_id: number
          prioridade: number
          tipo_ausencia: string
          tipo_funcionario_ajuste: string
          tipo_funcionario_ausente: string
          turno_ajuste: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          id?: number
          loja_id: number
          prioridade?: number
          tipo_ausencia: string
          tipo_funcionario_ajuste: string
          tipo_funcionario_ausente: string
          turno_ajuste?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          id?: number
          loja_id?: number
          prioridade?: number
          tipo_ausencia?: string
          tipo_funcionario_ajuste?: string
          tipo_funcionario_ausente?: string
          turno_ajuste?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_ajustes_automaticos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_config: {
        Row: {
          created_at: string | null
          folga_fixa: string | null
          horario_entrada: string
          horario_saida: string
          horario_saida_intervalo: string
          horario_volta_intervalo: string
          id: number
          loja_id: number
          observacoes: string | null
          updated_at: string | null
          usuario_id: number
        }
        Insert: {
          created_at?: string | null
          folga_fixa?: string | null
          horario_entrada?: string
          horario_saida?: string
          horario_saida_intervalo?: string
          horario_volta_intervalo?: string
          id?: number
          loja_id: number
          observacoes?: string | null
          updated_at?: string | null
          usuario_id: number
        }
        Update: {
          created_at?: string | null
          folga_fixa?: string | null
          horario_entrada?: string
          horario_saida?: string
          horario_saida_intervalo?: string
          horario_volta_intervalo?: string
          id?: number
          loja_id?: number
          observacoes?: string | null
          updated_at?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "escala_config_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_feriados: {
        Row: {
          created_at: string | null
          data: string
          id: number
          loja_id: number | null
          nome: string
          recorrente: boolean
          tipo: Database["public"]["Enums"]["feriado_tipo"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: number
          loja_id?: number | null
          nome: string
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["feriado_tipo"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: number
          loja_id?: number | null
          nome?: string
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["feriado_tipo"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_feriados_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_horario_especifico: {
        Row: {
          created_at: string | null
          data_ref: string
          horario_entrada: string
          horario_saida: string
          horario_saida_intervalo: string
          horario_volta_intervalo: string
          id: number
          loja_id: number
          observacao: string | null
          updated_at: string | null
          usuario_id: number
        }
        Insert: {
          created_at?: string | null
          data_ref: string
          horario_entrada: string
          horario_saida: string
          horario_saida_intervalo: string
          horario_volta_intervalo: string
          id?: number
          loja_id: number
          observacao?: string | null
          updated_at?: string | null
          usuario_id: number
        }
        Update: {
          created_at?: string | null
          data_ref?: string
          horario_entrada?: string
          horario_saida?: string
          horario_saida_intervalo?: string
          horario_volta_intervalo?: string
          id?: number
          loja_id?: number
          observacao?: string | null
          updated_at?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "escala_horario_especifico_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_horarios_dia: {
        Row: {
          created_at: string | null
          data: string
          horario_entrada: string
          horario_saida: string
          horario_saida_intervalo: string
          horario_volta_intervalo: string
          id: number
          observacoes: string | null
          updated_at: string | null
          usuario_id: number
        }
        Insert: {
          created_at?: string | null
          data: string
          horario_entrada: string
          horario_saida: string
          horario_saida_intervalo: string
          horario_volta_intervalo: string
          id?: number
          observacoes?: string | null
          updated_at?: string | null
          usuario_id: number
        }
        Update: {
          created_at?: string | null
          data?: string
          horario_entrada?: string
          horario_saida?: string
          horario_saida_intervalo?: string
          horario_volta_intervalo?: string
          id?: number
          observacoes?: string | null
          updated_at?: string | null
          usuario_id?: number
        }
        Relationships: []
      }
      escala_picos: {
        Row: {
          created_at: string | null
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: number
          loja_id: number
          nivel: Database["public"]["Enums"]["pico_nivel"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: number
          loja_id: number
          nivel?: Database["public"]["Enums"]["pico_nivel"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: number
          loja_id?: number
          nivel?: Database["public"]["Enums"]["pico_nivel"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_picos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_turnos: {
        Row: {
          cor: string | null
          created_at: string | null
          horario_entrada: string
          horario_saida: string
          horario_saida_intervalo: string
          horario_volta_intervalo: string
          id: number
          loja_id: number
          nome: string
          ordem: number
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          horario_entrada: string
          horario_saida: string
          horario_saida_intervalo: string
          horario_volta_intervalo: string
          id?: number
          loja_id: number
          nome: string
          ordem?: number
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          horario_entrada?: string
          horario_saida?: string
          horario_saida_intervalo?: string
          horario_volta_intervalo?: string
          id?: number
          loja_id?: number
          nome?: string
          ordem?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_turnos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      ferias: {
        Row: {
          ano_ferias: number
          aprovado_por: number | null
          data_atualizacao: string | null
          data_solicitacao: string
          id: number
          mes_ferias: string
          observacoes: string | null
          status: Database["public"]["Enums"]["ferias_status"]
          usuario_id: number
        }
        Insert: {
          ano_ferias: number
          aprovado_por?: number | null
          data_atualizacao?: string | null
          data_solicitacao: string
          id?: number
          mes_ferias: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["ferias_status"]
          usuario_id: number
        }
        Update: {
          ano_ferias?: number
          aprovado_por?: number | null
          data_atualizacao?: string | null
          data_solicitacao?: string
          id?: number
          mes_ferias?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["ferias_status"]
          usuario_id?: number
        }
        Relationships: []
      }
      ferias_historico: {
        Row: {
          acao: Database["public"]["Enums"]["ferias_acao"]
          data_acao: string
          ferias_id: number
          id: number
          observacoes: string | null
          usuario_id: number
        }
        Insert: {
          acao: Database["public"]["Enums"]["ferias_acao"]
          data_acao: string
          ferias_id: number
          id?: number
          observacoes?: string | null
          usuario_id: number
        }
        Update: {
          acao?: Database["public"]["Enums"]["ferias_acao"]
          data_acao?: string
          ferias_id?: number
          id?: number
          observacoes?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ferias_historico_ferias_id_fkey"
            columns: ["ferias_id"]
            isOneToOne: false
            referencedRelation: "ferias"
            referencedColumns: ["id"]
          },
        ]
      }
      folgas: {
        Row: {
          data_folga: string
          data_registro: string | null
          folga_id: number
          observacao: string | null
          periodo_id: number
          registrado_por: number | null
          usuario_id: number
        }
        Insert: {
          data_folga: string
          data_registro?: string | null
          folga_id?: number
          observacao?: string | null
          periodo_id: number
          registrado_por?: number | null
          usuario_id: number
        }
        Update: {
          data_folga?: string
          data_registro?: string | null
          folga_id?: number
          observacao?: string | null
          periodo_id?: number
          registrado_por?: number | null
          usuario_id?: number
        }
        Relationships: []
      }
      lastlogin: {
        Row: {
          data_login: string
          id: number
          ip_address: string | null
          user_agent: string | null
          usuario_id: number
        }
        Insert: {
          data_login: string
          id?: number
          ip_address?: string | null
          user_agent?: string | null
          usuario_id: number
        }
        Update: {
          data_login?: string
          id?: number
          ip_address?: string | null
          user_agent?: string | null
          usuario_id?: number
        }
        Relationships: []
      }
      listafun: {
        Row: {
          cpffun: string | null
          id: number
          matfun: string
          nomefun: string
        }
        Insert: {
          cpffun?: string | null
          id?: number
          matfun: string
          nomefun: string
        }
        Update: {
          cpffun?: string | null
          id?: number
          matfun?: string
          nomefun?: string
        }
        Relationships: []
      }
      log_eventos: {
        Row: {
          data_evento: string | null
          descricao: string | null
          id: number
          ip_address: string | null
          tipo_evento: string
          user_agent: string | null
          usuario_id: number | null
        }
        Insert: {
          data_evento?: string | null
          descricao?: string | null
          id?: number
          ip_address?: string | null
          tipo_evento: string
          user_agent?: string | null
          usuario_id?: number | null
        }
        Update: {
          data_evento?: string | null
          descricao?: string | null
          id?: number
          ip_address?: string | null
          tipo_evento?: string
          user_agent?: string | null
          usuario_id?: number | null
        }
        Relationships: []
      }
      lojas: {
        Row: {
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          grupo_id: number | null
          id: number
          nome: string
          numero: string
          numero_endereco: string | null
          regiao: Database["public"]["Enums"]["regiao_tipo"]
          rua: string | null
          senha: string | null
          supervisao: string | null
        }
        Insert: {
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          grupo_id?: number | null
          id?: number
          nome: string
          numero: string
          numero_endereco?: string | null
          regiao: Database["public"]["Enums"]["regiao_tipo"]
          rua?: string | null
          senha?: string | null
          supervisao?: string | null
        }
        Update: {
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          grupo_id?: number | null
          id?: number
          nome?: string
          numero?: string
          numero_endereco?: string | null
          regiao?: Database["public"]["Enums"]["regiao_tipo"]
          rua?: string | null
          senha?: string | null
          supervisao?: string | null
        }
        Relationships: []
      }
      lojas_resumo_999: {
        Row: {
          ativo: boolean | null
          data_criacao: string | null
          dia_resumo: number
          id: number
          loja_id: number
        }
        Insert: {
          ativo?: boolean | null
          data_criacao?: string | null
          dia_resumo: number
          id?: number
          loja_id: number
        }
        Update: {
          ativo?: boolean | null
          data_criacao?: string | null
          dia_resumo?: number
          id?: number
          loja_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lojas_resumo_999_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_meta"] | null
          id: number
          meta_mensal: number
          periodo_meta_id: number | null
          usuario_id: number
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_meta"] | null
          id?: number
          meta_mensal: number
          periodo_meta_id?: number | null
          usuario_id: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_meta"] | null
          id?: number
          meta_mensal?: number
          periodo_meta_id?: number | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_periodo_meta_id_fkey"
            columns: ["periodo_meta_id"]
            isOneToOne: false
            referencedRelation: "periodos_meta"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_loja: {
        Row: {
          criado_por_usuario_id: number | null
          data_atualizacao: string | null
          data_criacao: string | null
          id: number
          loja_id: number
          meta_valor_total: number
          observacoes: string | null
          periodo_meta_id: number
        }
        Insert: {
          criado_por_usuario_id?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: number
          loja_id: number
          meta_valor_total?: number
          observacoes?: string | null
          periodo_meta_id: number
        }
        Update: {
          criado_por_usuario_id?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: number
          loja_id?: number
          meta_valor_total?: number
          observacoes?: string | null
          periodo_meta_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_loja_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_loja_periodo_meta_id_fkey"
            columns: ["periodo_meta_id"]
            isOneToOne: false
            referencedRelation: "periodos_meta"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_loja_categorias: {
        Row: {
          categoria: string
          id: number
          meta_loja_id: number
          meta_valor: number
        }
        Insert: {
          categoria: string
          id?: number
          meta_loja_id: number
          meta_valor?: number
        }
        Update: {
          categoria?: string
          id?: number
          meta_loja_id?: number
          meta_valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_loja_categorias_meta_loja_id_fkey"
            columns: ["meta_loja_id"]
            isOneToOne: false
            referencedRelation: "metas_loja"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          data_criacao: string
          data_leitura: string | null
          id: number
          lida: boolean
          loja_id: number | null
          mensagem: string
          tipo: Database["public"]["Enums"]["notificacao_tipo"]
          titulo: string
          usuario_destinatario_id: number
          usuario_remetente_id: number
        }
        Insert: {
          data_criacao: string
          data_leitura?: string | null
          id?: number
          lida?: boolean
          loja_id?: number | null
          mensagem: string
          tipo?: Database["public"]["Enums"]["notificacao_tipo"]
          titulo: string
          usuario_destinatario_id: number
          usuario_remetente_id: number
        }
        Update: {
          data_criacao?: string
          data_leitura?: string | null
          id?: number
          lida?: boolean
          loja_id?: number | null
          mensagem?: string
          tipo?: Database["public"]["Enums"]["notificacao_tipo"]
          titulo?: string
          usuario_destinatario_id?: number
          usuario_remetente_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          data_alteracao: string | null
          data_atualizacao: string
          data_criacao: string
          id: number
          lido: boolean
          loja_id: number
          mensagem: string
          prioridade: Database["public"]["Enums"]["prioridade_tipo"]
          privada: boolean
          status: Database["public"]["Enums"]["ocorrencia_status"]
          titulo: string
          usuario_destino_id: number
          usuario_id: number
        }
        Insert: {
          data_alteracao?: string | null
          data_atualizacao: string
          data_criacao: string
          id?: number
          lido?: boolean
          loja_id: number
          mensagem: string
          prioridade?: Database["public"]["Enums"]["prioridade_tipo"]
          privada?: boolean
          status?: Database["public"]["Enums"]["ocorrencia_status"]
          titulo: string
          usuario_destino_id: number
          usuario_id: number
        }
        Update: {
          data_alteracao?: string | null
          data_atualizacao?: string
          data_criacao?: string
          id?: number
          lido?: boolean
          loja_id?: number
          mensagem?: string
          prioridade?: Database["public"]["Enums"]["prioridade_tipo"]
          privada?: boolean
          status?: Database["public"]["Enums"]["ocorrencia_status"]
          titulo?: string
          usuario_destino_id?: number
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias_historico: {
        Row: {
          data_alteracao: string | null
          descricao: string | null
          id: number
          ocorrencia_id: number
          tipo_alteracao: string
          usuario_id: number
        }
        Insert: {
          data_alteracao?: string | null
          descricao?: string | null
          id?: number
          ocorrencia_id: number
          tipo_alteracao: string
          usuario_id: number
        }
        Update: {
          data_alteracao?: string | null
          descricao?: string | null
          id?: number
          ocorrencia_id?: number
          tipo_alteracao?: string
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_historico_ocorrencia_id_fkey"
            columns: ["ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "ocorrencias"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias_respostas: {
        Row: {
          data_criacao: string
          id: number
          mensagem: string
          ocorrencia_id: number
          usuario_id: number
        }
        Insert: {
          data_criacao: string
          id?: number
          mensagem: string
          ocorrencia_id: number
          usuario_id: number
        }
        Update: {
          data_criacao?: string
          id?: number
          mensagem?: string
          ocorrencia_id?: number
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_respostas_ocorrencia_id_fkey"
            columns: ["ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "ocorrencias"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias_visualizacoes: {
        Row: {
          data_visualizacao: string
          id: number
          ocorrencia_id: number
          usuario_id: number
        }
        Insert: {
          data_visualizacao: string
          id?: number
          ocorrencia_id: number
          usuario_id: number
        }
        Update: {
          data_visualizacao?: string
          id?: number
          ocorrencia_id?: number
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_visualizacoes_ocorrencia_id_fkey"
            columns: ["ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "ocorrencias"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          codigo: string
          data_adicao: string
          desconto: number
          descricao: string
          id: number
          orcamento_id: number
          pmc: number
          quantidade: number
          valor_final: number
        }
        Insert: {
          codigo: string
          data_adicao?: string
          desconto?: number
          descricao: string
          id?: number
          orcamento_id: number
          pmc: number
          quantidade?: number
          valor_final: number
        }
        Update: {
          codigo?: string
          data_adicao?: string
          desconto?: number
          descricao?: string
          id?: number
          orcamento_id?: number
          pmc?: number
          quantidade?: number
          valor_final?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cliente_cpf: string | null
          cliente_email: string | null
          cliente_endereco: string | null
          cliente_nome: string
          cliente_observacoes: string | null
          cliente_telefone: string | null
          codigo: string
          data_criacao: string
          data_validade: string
          filial_id: number | null
          filial_nome: string | null
          gerador_cargo: string | null
          gerador_nome: string
          id: number
          ip_criacao: string | null
          quantidade_itens: number
          status: Database["public"]["Enums"]["orcamento_status"]
          usuario_id: number | null
          valor_total: number
        }
        Insert: {
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_nome: string
          cliente_observacoes?: string | null
          cliente_telefone?: string | null
          codigo: string
          data_criacao?: string
          data_validade: string
          filial_id?: number | null
          filial_nome?: string | null
          gerador_cargo?: string | null
          gerador_nome: string
          id?: number
          ip_criacao?: string | null
          quantidade_itens?: number
          status?: Database["public"]["Enums"]["orcamento_status"]
          usuario_id?: number | null
          valor_total?: number
        }
        Update: {
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_nome?: string
          cliente_observacoes?: string | null
          cliente_telefone?: string | null
          codigo?: string
          data_criacao?: string
          data_validade?: string
          filial_id?: number | null
          filial_nome?: string | null
          gerador_cargo?: string | null
          gerador_nome?: string
          id?: number
          ip_criacao?: string | null
          quantidade_itens?: number
          status?: Database["public"]["Enums"]["orcamento_status"]
          usuario_id?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      pdvpro: {
        Row: {
          codigo: string
          codint: number | null
          created_at: string | null
          grupo: number | null
          nome: string
          nompati: string | null
          tipogru: number | null
          updated_at: string | null
        }
        Insert: {
          codigo: string
          codint?: number | null
          created_at?: string | null
          grupo?: number | null
          nome: string
          nompati?: string | null
          tipogru?: number | null
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          codint?: number | null
          created_at?: string | null
          grupo?: number | null
          nome?: string
          nompati?: string | null
          tipogru?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      periodos_meta: {
        Row: {
          data_criacao: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: number
          status: Database["public"]["Enums"]["periodo_status"]
        }
        Insert: {
          data_criacao?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: number
          status?: Database["public"]["Enums"]["periodo_status"]
        }
        Update: {
          data_criacao?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: number
          status?: Database["public"]["Enums"]["periodo_status"]
        }
        Relationships: []
      }
      recados: {
        Row: {
          autor_id: number
          conteudo: string | null
          data_atualizacao: string | null
          data_criacao: string
          id: number
          loja_id: number
          titulo: string | null
        }
        Insert: {
          autor_id: number
          conteudo?: string | null
          data_atualizacao?: string | null
          data_criacao: string
          id?: number
          loja_id: number
          titulo?: string | null
        }
        Update: {
          autor_id?: number
          conteudo?: string | null
          data_atualizacao?: string | null
          data_criacao?: string
          id?: number
          loja_id?: number
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recados_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      recados_leitura: {
        Row: {
          data_leitura: string
          id: number
          recado_id: number
          usuario_id: number
        }
        Insert: {
          data_leitura: string
          id?: number
          recado_id: number
          usuario_id: number
        }
        Update: {
          data_leitura?: string
          id?: number
          recado_id?: number
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "recados_leitura_recado_id_fkey"
            columns: ["recado_id"]
            isOneToOne: false
            referencedRelation: "recados"
            referencedColumns: ["id"]
          },
        ]
      }
      recados_notificacoes: {
        Row: {
          data_notificacao: string
          id: number
          recado_id: number
          usuario_id: number
          visualizada: boolean
        }
        Insert: {
          data_notificacao: string
          id?: number
          recado_id: number
          usuario_id: number
          visualizada?: boolean
        }
        Update: {
          data_notificacao?: string
          id?: number
          recado_id?: number
          usuario_id?: number
          visualizada?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recados_notificacoes_recado_id_fkey"
            columns: ["recado_id"]
            isOneToOne: false
            referencedRelation: "recados"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_tokens: {
        Row: {
          data_criacao: string | null
          data_expiracao: string
          id: number
          ip_address: string | null
          token: string
          usuario_id: number
          utilizado: boolean | null
        }
        Insert: {
          data_criacao?: string | null
          data_expiracao: string
          id?: number
          ip_address?: string | null
          token: string
          usuario_id: number
          utilizado?: boolean | null
        }
        Update: {
          data_criacao?: string | null
          data_expiracao?: string
          id?: number
          ip_address?: string | null
          token?: string
          usuario_id?: number
          utilizado?: boolean | null
        }
        Relationships: []
      }
      registros_ponto: {
        Row: {
          data: string
          dia_semana: string
          entrada1: string | null
          entrada2: string | null
          id: number
          observacao: string | null
          relatorio_id: number
          saida1: string | null
          saida2: string | null
          status: Database["public"]["Enums"]["registro_status"]
          total_horas: string | null
        }
        Insert: {
          data: string
          dia_semana: string
          entrada1?: string | null
          entrada2?: string | null
          id?: number
          observacao?: string | null
          relatorio_id: number
          saida1?: string | null
          saida2?: string | null
          status?: Database["public"]["Enums"]["registro_status"]
          total_horas?: string | null
        }
        Update: {
          data?: string
          dia_semana?: string
          entrada1?: string | null
          entrada2?: string | null
          id?: number
          observacao?: string | null
          relatorio_id?: number
          saida1?: string | null
          saida2?: string | null
          status?: Database["public"]["Enums"]["registro_status"]
          total_horas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_relatorio_id_fkey"
            columns: ["relatorio_id"]
            isOneToOne: false
            referencedRelation: "relatorios_ponto"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_ponto: {
        Row: {
          ano: number
          arquivo: string
          data_analise: string | null
          data_upload: string
          funcionario_id: number
          id: number
          loja_id: number
          mes: number
          status: Database["public"]["Enums"]["relatorio_status"]
          usuario_analise_id: number | null
          usuario_upload_id: number
        }
        Insert: {
          ano: number
          arquivo: string
          data_analise?: string | null
          data_upload: string
          funcionario_id: number
          id?: number
          loja_id: number
          mes: number
          status?: Database["public"]["Enums"]["relatorio_status"]
          usuario_analise_id?: number | null
          usuario_upload_id: number
        }
        Update: {
          ano?: number
          arquivo?: string
          data_analise?: string | null
          data_upload?: string
          funcionario_id?: number
          id?: number
          loja_id?: number
          mes?: number
          status?: Database["public"]["Enums"]["relatorio_status"]
          usuario_analise_id?: number | null
          usuario_upload_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_ponto_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      selfcheckout_dados: {
        Row: {
          clientes_caixa: number
          clientes_total: number
          data_atualizacao: string | null
          data_cadastro: string
          data_lancamento: string
          id: number
          loja_id: number
          matricula_caixa: string
          pagamento_convenio: number
          pagamento_credito: number
          pagamento_debito: number
          pagamento_dinheiro: number
          pagamento_pos: number
          valor_convenio: number | null
          valor_credito: number | null
          valor_debito: number | null
          valor_dinheiro: number | null
          valor_pos: number | null
        }
        Insert: {
          clientes_caixa: number
          clientes_total: number
          data_atualizacao?: string | null
          data_cadastro: string
          data_lancamento: string
          id?: number
          loja_id: number
          matricula_caixa?: string
          pagamento_convenio?: number
          pagamento_credito?: number
          pagamento_debito?: number
          pagamento_dinheiro?: number
          pagamento_pos?: number
          valor_convenio?: number | null
          valor_credito?: number | null
          valor_debito?: number | null
          valor_dinheiro?: number | null
          valor_pos?: number | null
        }
        Update: {
          clientes_caixa?: number
          clientes_total?: number
          data_atualizacao?: string | null
          data_cadastro?: string
          data_lancamento?: string
          id?: number
          loja_id?: number
          matricula_caixa?: string
          pagamento_convenio?: number
          pagamento_credito?: number
          pagamento_debito?: number
          pagamento_dinheiro?: number
          pagamento_pos?: number
          valor_convenio?: number | null
          valor_credito?: number | null
          valor_debito?: number | null
          valor_dinheiro?: number | null
          valor_pos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "selfcheckout_dados_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      tutoriais: {
        Row: {
          autor_id: number
          cargos_permitidos: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          id: number
          loja_id: number
          titulo: string
        }
        Insert: {
          autor_id: number
          cargos_permitidos?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: number
          loja_id: number
          titulo: string
        }
        Update: {
          autor_id?: number
          cargos_permitidos?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          id?: number
          loja_id?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutoriais_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      tutoriais_passos: {
        Row: {
          conteudo_passo: string
          id: number
          imagem_url: string | null
          numero_passo: number
          titulo_passo: string | null
          tutorial_id: number
        }
        Insert: {
          conteudo_passo: string
          id?: number
          imagem_url?: string | null
          numero_passo: number
          titulo_passo?: string | null
          tutorial_id: number
        }
        Update: {
          conteudo_passo?: string
          id?: number
          imagem_url?: string | null
          numero_passo?: number
          titulo_passo?: string | null
          tutorial_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tutoriais_passos_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutoriais"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatars: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          id: string
          mime_type: string
          storage_path: string
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          storage_path: string
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          storage_path?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          created_at: string | null
          expiry: string
          id: number
          token: string
          usuario_id: number
        }
        Insert: {
          created_at?: string | null
          expiry: string
          id?: number
          token: string
          usuario_id: number
        }
        Update: {
          created_at?: string | null
          expiry?: string
          id?: number
          token?: string
          usuario_id?: number
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          avatar: string | null
          CPF: string | null
          data_cadastro: string | null
          data_contratacao: string | null
          data_nascimento: string | null
          email: string | null
          id: number
          login: string | null
          loja_id: number | null
          matricula: string | null
          nome: string | null
          permissao: string | null
          porcentagem_comissao_conveniencia: string | null
          porcentagem_comissao_dermocosmetico: string | null
          porcentagem_comissao_generico: string | null
          porcentagem_comissao_goodlife: string | null
          porcentagem_comissao_perfumaria_alta: string | null
          porcentagem_comissao_similar: string | null
          senha: string | null
          senha_provisoria: number | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          avatar?: string | null
          CPF?: string | null
          data_cadastro?: string | null
          data_contratacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          id: number
          login?: string | null
          loja_id?: number | null
          matricula?: string | null
          nome?: string | null
          permissao?: string | null
          porcentagem_comissao_conveniencia?: string | null
          porcentagem_comissao_dermocosmetico?: string | null
          porcentagem_comissao_generico?: string | null
          porcentagem_comissao_goodlife?: string | null
          porcentagem_comissao_perfumaria_alta?: string | null
          porcentagem_comissao_similar?: string | null
          senha?: string | null
          senha_provisoria?: number | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          avatar?: string | null
          CPF?: string | null
          data_cadastro?: string | null
          data_contratacao?: string | null
          data_nascimento?: string | null
          email?: string | null
          id?: number
          login?: string | null
          loja_id?: number | null
          matricula?: string | null
          nome?: string | null
          permissao?: string | null
          porcentagem_comissao_conveniencia?: string | null
          porcentagem_comissao_dermocosmetico?: string | null
          porcentagem_comissao_generico?: string | null
          porcentagem_comissao_goodlife?: string | null
          porcentagem_comissao_perfumaria_alta?: string | null
          porcentagem_comissao_similar?: string | null
          senha?: string | null
          senha_provisoria?: number | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      usuarios_recusados: {
        Row: {
          data_registro: string | null
          id: number
          motivo: string | null
          usuario_id: number
        }
        Insert: {
          data_registro?: string | null
          id?: number
          motivo?: string | null
          usuario_id: number
        }
        Update: {
          data_registro?: string | null
          id?: number
          motivo?: string | null
          usuario_id?: number
        }
        Relationships: []
      }
      vendas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_venda"]
          data_registro: string | null
          data_venda: string
          id: number
          observacoes: string | null
          registrado_por_usuario_id: number | null
          usuario_id: number
          valor_comissao: number
          valor_venda: number
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_venda"]
          data_registro?: string | null
          data_venda: string
          id?: number
          observacoes?: string | null
          registrado_por_usuario_id?: number | null
          usuario_id: number
          valor_comissao: number
          valor_venda: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_venda"]
          data_registro?: string | null
          data_venda?: string
          id?: number
          observacoes?: string | null
          registrado_por_usuario_id?: number | null
          usuario_id?: number
          valor_comissao?: number
          valor_venda?: number
        }
        Relationships: []
      }
      vendas_loja: {
        Row: {
          categoria: string
          data_registro: string | null
          data_venda: string
          id: number
          loja_id: number
          observacao: number | null
          quantidade: number | null
          registrado_por_usuario_id: number | null
          valor_venda: number
        }
        Insert: {
          categoria: string
          data_registro?: string | null
          data_venda: string
          id?: number
          loja_id: number
          observacao?: number | null
          quantidade?: number | null
          registrado_por_usuario_id?: number | null
          valor_venda?: number
        }
        Update: {
          categoria?: string
          data_registro?: string | null
          data_venda?: string
          id?: number
          loja_id?: number
          observacao?: number | null
          quantidade?: number | null
          registrado_por_usuario_id?: number | null
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_loja_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_lojas_api_dados: {
        Row: {
          campanha_id: number
          cdfil: number
          created_at: string | null
          data_venda: string
          id: number
          nomefil: string | null
          total_qtd_ve: number | null
          total_vlr_ve: number | null
          updated_at: string | null
        }
        Insert: {
          campanha_id: number
          cdfil: number
          created_at?: string | null
          data_venda: string
          id?: number
          nomefil?: string | null
          total_qtd_ve?: number | null
          total_vlr_ve?: number | null
          updated_at?: string | null
        }
        Update: {
          campanha_id?: number
          cdfil?: number
          created_at?: string | null
          data_venda?: string
          id?: number
          nomefil?: string | null
          total_qtd_ve?: number | null
          total_vlr_ve?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ticket_medio_selfcheckout: {
        Row: {
          data_lancamento: string | null
          loja_id: number | null
          max_clientes_total: number | null
          ticket_medio: number | null
          total_vendas_dia: number | null
        }
        Relationships: [
          {
            foreignKeyName: "selfcheckout_dados_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calcular_ticket_medio_selfcheckout: {
        Args: { p_data_fim?: string; p_data_inicio?: string; p_loja_id: number }
        Returns: {
          clientes_atendidos: number
          data_lancamento: string
          ticket_medio: number
          vendas_geral_dia: number
        }[]
      }
      get_authenticated_user_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_current_user_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          loja_id: number
          tipo: string
        }[]
      }
      upsert_vendas: {
        Args: { vendas_data: Json }
        Returns: undefined
      }
    }
    Enums: {
      arquivo_tipo: "avatar" | "documento" | "comprovante" | "outro"
      banco_status: "ativo" | "inativo"
      campanha_status: "ativa" | "inativa" | "encerrada"
      campanha_tipo: "valor" | "quantidade"
      categoria_meta:
        | "geral"
        | "generico_similar"
        | "goodlife"
        | "perfumaria_alta"
        | "dermocosmetico"
      categoria_venda:
        | "geral"
        | "similar"
        | "generico"
        | "dermocosmetico"
        | "goodlife"
        | "perfumaria_alta"
        | "rentaveis20"
        | "rentaveis25"
        | "conveniencia"
        | "brinquedo"
      correcao_status: "pendente" | "aprovado" | "rejeitado"
      correcao_tipo: "entrada" | "saida" | "intervalo" | "jornada" | "outro"
      feriado_tipo: "nacional" | "estadual" | "municipal" | "corporativo"
      ferias_acao:
        | "solicitado"
        | "encaminhado"
        | "aprovado"
        | "rejeitado"
        | "cancelado"
      ferias_status:
        | "pendente"
        | "pendente_aprovacao"
        | "aprovado"
        | "rejeitado"
        | "cancelado"
      notificacao_tipo: "info" | "aviso" | "urgente"
      ocorrencia_status: "pendente" | "respondido" | "resolvido"
      orcamento_status: "ativo" | "concluido" | "cancelado" | "expirado"
      periodo_status: "ativo" | "inativo"
      pico_nivel: "baixo" | "medio" | "alto"
      prioridade_tipo: "baixa" | "media" | "alta"
      regiao_tipo: "centro" | "outros"
      registro_status: "normal" | "incompleto" | "folga" | "ferias" | "atestado"
      relatorio_status: "pendente" | "analisado" | "corrigido" | "ok"
      user_status: "ativo" | "inativo" | "bloqueado" | "recusado" | "pendente"
      user_tipo:
        | "gerente"
        | "farmaceutico"
        | "auxiliar"
        | "consultora"
        | "aux_conveniencia"
        | "lider"
        | "aux1"
        | "fiscal"
        | "zelador"
        | "sub"
        | "subfarma"
        | "treinador"
        | "desenvolvedor"
        | "estagiario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      arquivo_tipo: ["avatar", "documento", "comprovante", "outro"],
      banco_status: ["ativo", "inativo"],
      campanha_status: ["ativa", "inativa", "encerrada"],
      campanha_tipo: ["valor", "quantidade"],
      categoria_meta: [
        "geral",
        "generico_similar",
        "goodlife",
        "perfumaria_alta",
        "dermocosmetico",
      ],
      categoria_venda: [
        "geral",
        "similar",
        "generico",
        "dermocosmetico",
        "goodlife",
        "perfumaria_alta",
        "rentaveis20",
        "rentaveis25",
        "conveniencia",
        "brinquedo",
      ],
      correcao_status: ["pendente", "aprovado", "rejeitado"],
      correcao_tipo: ["entrada", "saida", "intervalo", "jornada", "outro"],
      feriado_tipo: ["nacional", "estadual", "municipal", "corporativo"],
      ferias_acao: [
        "solicitado",
        "encaminhado",
        "aprovado",
        "rejeitado",
        "cancelado",
      ],
      ferias_status: [
        "pendente",
        "pendente_aprovacao",
        "aprovado",
        "rejeitado",
        "cancelado",
      ],
      notificacao_tipo: ["info", "aviso", "urgente"],
      ocorrencia_status: ["pendente", "respondido", "resolvido"],
      orcamento_status: ["ativo", "concluido", "cancelado", "expirado"],
      periodo_status: ["ativo", "inativo"],
      pico_nivel: ["baixo", "medio", "alto"],
      prioridade_tipo: ["baixa", "media", "alta"],
      regiao_tipo: ["centro", "outros"],
      registro_status: ["normal", "incompleto", "folga", "ferias", "atestado"],
      relatorio_status: ["pendente", "analisado", "corrigido", "ok"],
      user_status: ["ativo", "inativo", "bloqueado", "recusado", "pendente"],
      user_tipo: [
        "gerente",
        "farmaceutico",
        "auxiliar",
        "consultora",
        "aux_conveniencia",
        "lider",
        "aux1",
        "fiscal",
        "zelador",
        "sub",
        "subfarma",
        "treinador",
        "desenvolvedor",
        "estagiario",
      ],
    },
  },
} as const
