"""
Script simplificado para inicializar o DVC e rastrear os arquivos de dados.
Este script configura o DVC para rastrear apenas os arquivos na pasta data/,
garantindo que não sejam commitados no Git.

Uso:
    python dvc_init.py
"""

import os
import sys

# Lista de arquivos de dados para rastrear com o DVC
DATA_FILES = [
    "data/merged_dataset.csv",
    "data/payers-v1.feather",
    "data/seller_terminals-v1.feather",
    "data/transactions_train-v1.feather"
]

def print_info(message):
    """Imprime uma mensagem de informação"""
    print(f"[INFO] {message}")

def print_error(message):
    """Imprime uma mensagem de erro"""
    print(f"[ERRO] {message}", file=sys.stderr)

def run_command(command):
    """Executa um comando simples e retorna se foi bem-sucedido"""
    print(f"Executando: {command}")
    exit_code = os.system(command)
    return exit_code == 0

def init_dvc():
    """Inicializa o DVC no repositório"""
    if os.path.exists(".dvc"):
        print_info("DVC já está inicializado neste repositório")
        return True
    
    print_info("Inicializando DVC...")
    return run_command("dvc init --no-scm")

def track_data_files():
    """Adiciona os arquivos de dados ao rastreamento do DVC"""
    print_info("Adicionando arquivos ao controle de versão do DVC...")
    
    for file_path in DATA_FILES:
        if os.path.exists(file_path):
            print_info(f"Rastreando {file_path}...")
            if not run_command(f'dvc add "{file_path}"'):
                print_error(f"Falha ao adicionar {file_path}")
        else:
            print_error(f"Arquivo não encontrado: {file_path}")

def ensure_gitignore():
    """Garante que os arquivos de dados estejam no .gitignore"""
    gitignore_path = ".gitignore"
    gitignore_entries = []
    
    # Lê o gitignore existente, se houver
    if os.path.exists(gitignore_path):
        with open(gitignore_path, "r") as f:
            gitignore_entries = f.read().splitlines()
      # Entradas que precisamos garantir que estejam no .gitignore
    needed_entries = [
        "/data/*.csv",
        "/data/*.feather",
        "/data/*.parquet",
        "!*.dvc"  # NÃO ignorar arquivos .dvc - eles devem ser commitados no Git
    ]
    
    # Adiciona entradas que ainda não estão no .gitignore
    with open(gitignore_path, "a") as f:
        for entry in needed_entries:
            if entry not in gitignore_entries:
                f.write(f"\n{entry}")
                print_info(f"Adicionado {entry} ao .gitignore")

def main():
    """Função principal"""
    try:
        # Inicializa o DVC se ainda não estiver inicializado
        if init_dvc():
            # Garante que o .gitignore esteja configurado
            ensure_gitignore()
            
            # Adiciona arquivos de dados ao DVC
            track_data_files()
            
            print_info("\nInicialização do DVC concluída com sucesso!")
            print_info("\nLembre-se:")
            print_info("- Os arquivos de dados agora são rastreados pelo DVC, não pelo Git")
            print_info("- Use 'dvc status' para verificar o status dos arquivos")
            print_info("- Use 'dvc repro' para recriar os dados baseado no pipeline")
            
    except Exception as e:
        print_error(f"Erro: {e}")

if __name__ == "__main__":
    main()
