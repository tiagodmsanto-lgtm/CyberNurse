import pandas as pd
import unicodedata

def clean_text(text):
    if pd.isna(text):
        return text
    # Converte para string caso não seja
    text = str(text)
    # Remove acentos e converte para maiúsculo
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    return text.upper().strip()

def process_anvisa_data(input_file, output_file):
    print(f"Lendo o arquivo bruto: {input_file}...")
    try:
        # 1. Ler o arquivo usando pandas com o separador ';' e codificação 'latin1'
        df = pd.read_csv(input_file, sep=';', encoding='latin1', low_memory=False)
        
        # 2. Manter apenas as colunas específicas
        cols_to_keep = ['NO_PRODUTO', 'DS_SUBSTANCIA', 'DS_APRESENTACAO', 'CO_EAN']
        df = df[cols_to_keep]
        
        # 3. Renomear as colunas
        df = df.rename(columns={
            'NO_PRODUTO': 'nomeComercial',
            'DS_SUBSTANCIA': 'principioAtivo',
            'DS_APRESENTACAO': 'apresentacao',
            'CO_EAN': 'codigoEan'
        })
        
        # 5. Remover linhas com 'nomeComercial' nulo
        df = df.dropna(subset=['nomeComercial'])
        
        # 4. Tratar os textos (maiusculas, remover acentos)
        print("Limpando textos e padronizando...")
        for col in ['nomeComercial', 'principioAtivo', 'apresentacao']:
            df[col] = df[col].apply(clean_text)
            
        # Converter codigoEan para string, removendo decimais caso existam
        df['codigoEan'] = df['codigoEan'].astype(str).str.replace(r'\.0$', '', regex=True)
            
        # 5. Remover linhas duplicadas
        initial_count = len(df)
        df = df.drop_duplicates()
        final_count = len(df)
        print(f"Linhas duplicadas removidas: {initial_count - final_count}")
        
        # 6. Exportar o resultado final
        print(f"Exportando arquivo limpo para: {output_file}...")
        df.to_csv(output_file, sep=',', encoding='utf-8', index=False)
        
        print(f"Processo concluído com sucesso! Total de registros: {len(df)}")
        
    except FileNotFoundError:
        print(f"Erro: O arquivo '{input_file}' não foi encontrado no diretório atual.")
    except Exception as e:
        print(f"Ocorreu um erro durante o processamento: {str(e)}")

if __name__ == "__main__":
    input_filename = 'TA_PRECOS_MEDICAMENTOS.csv'
    output_filename = 'medicamentos_limpos.csv'
    process_anvisa_data(input_filename, output_filename)
