import pandas as pd

def process_alimentos_data(input_file, output_file):
    print(f"Lendo o arquivo bruto: {input_file}...")
    try:
        # 1. Ler o arquivo com separador ';' e codificação 'latin1'
        df = pd.read_csv(input_file, sep=';', encoding='latin1', low_memory=False)
        
        # Verificar se as colunas necessárias existem
        required_cols = ['ST_SITUACAO_REGISTRO', 'NO_PRODUTO', 'DS_CATEGORIA_PRODUTO']
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"A coluna {col} não foi encontrada no arquivo.")

        # 2. Filtrar a coluna 'ST_SITUACAO_REGISTRO' para manter apenas 'Ativo'
        print("Filtrando produtos com status 'Ativo'...")
        # Tratando possiveis espaços extras antes/depois ou caixa alta/baixa no csv
        df['ST_SITUACAO_REGISTRO'] = df['ST_SITUACAO_REGISTRO'].astype(str).str.strip().str.capitalize()
        df = df[df['ST_SITUACAO_REGISTRO'] == 'Ativo']
        
        # 3. Manter apenas as colunas úteis para um app de consulta
        df = df[['NO_PRODUTO', 'DS_CATEGORIA_PRODUTO']]
        
        # 4. Renomear as colunas
        df = df.rename(columns={
            'NO_PRODUTO': 'nomeProduto',
            'DS_CATEGORIA_PRODUTO': 'categoria'
        })
        
        # Remover linhas vazias e remover duplicatas, caso existam, para manter os dados limpos
        df = df.dropna(subset=['nomeProduto'])
        df = df.drop_duplicates()
        
        # 5. Salvar o arquivo final limpo em formato 'utf-8' e separador ','
        print(f"Exportando arquivo limpo para: {output_file}...")
        df.to_csv(output_file, sep=',', encoding='utf-8', index=False)
        
        print(f"Processo concluído com sucesso! Total de registros salvos: {len(df)}")
        
    except FileNotFoundError:
        print(f"Erro: O arquivo '{input_file}' não foi encontrado no diretório atual.")
    except Exception as e:
        print(f"Ocorreu um erro durante o processamento: {str(e)}")

if __name__ == "__main__":
    input_filename = 'DADOS_ABERTOS_ALIMENTO.csv'
    output_filename = 'alimentos_suplementos_limpos.csv'
    process_alimentos_data(input_filename, output_filename)
