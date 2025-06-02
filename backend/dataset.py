import pandas as pd
import numpy as np
import reverse_geocoder as rg

def load_datasets():
    """
    Carrega os datasets necessários para o processamento.
    """
    df_pays = pd.read_feather("../data/payers-v1.feather")
    df_sellers = pd.read_feather("../data/seller_terminals-v1.feather")
    df_transactions = pd.read_feather("../data/transactions_train-v1.feather")
    return df_pays, df_sellers, df_transactions

def merge_datasets(df_transactions, df_pays, df_sellers):
    """
    Realiza o merge dos três dataframes, mantendo todas as transações e adicionando informações
    dos payers e sellers quando disponíveis.
    """
    df_merged = pd.merge(df_transactions, df_pays, left_on='card_id', right_on='card_hash', how='left')
    
    df_merged = pd.merge(df_merged, df_sellers, on='terminal_id', how='left')
    
    for col in df_merged.columns:
        if df_merged[col].dtype == 'object':
            df_merged[col] = df_merged[col].fillna('Desconhecido')
        elif df_merged[col].dtype in ['int64', 'float64']:
            df_merged[col] = df_merged[col].fillna(0)
    
    return df_merged

def add_card_frequency_features(df_merged):
    """
    Adiciona features de frequência relacionadas ao cartão.
    """
    df_merged = df_merged.sort_values(['card_hash', 'tx_datetime'])
    
    # Frequência Diária
    df_merged['card_daily_transaction_count'] = (
        df_merged.groupby(['card_hash', 'tx_date']).cumcount()
    )

    # Frequência Semanal
    df_merged['tx_week_start'] = df_merged['tx_date'] - pd.to_timedelta(df_merged['tx_date'].dt.weekday, unit='d')
    df_merged['card_weekly_transaction_count'] = (
        df_merged.groupby(['card_hash', 'tx_week_start']).cumcount()
    )

    # Frequência por hora
    df_merged['tx_hour'] = df_merged['tx_datetime'].dt.floor('h')
    df_merged['card_hourly_transaction_count'] = (
        df_merged.groupby(['card_hash', 'tx_hour']).cumcount()
    )

    # Frequência a cada 6 horas
    df_merged['tx_datetime'] = pd.to_datetime(df_merged['tx_datetime'])
    df_merged['tx_6h_start'] = (
        df_merged['tx_datetime']
        .dt.normalize()
        + pd.to_timedelta((df_merged['tx_datetime'].dt.hour // 6) * 6, unit='h')
    )
    df_merged['card_6h_transaction_count'] = (
        df_merged.groupby(['card_hash', 'tx_6h_start']).cumcount()
    )

    return df_merged

def add_card_amount_features(df_merged):
    """
    Adiciona features relacionadas aos valores das transações do cartão.
    """
    df_merged = df_merged.sort_values(['card_hash', 'tx_datetime'])
    
    # Média e Desvio Padrão Total
    df_merged['card_mean_transaction_amount'] = (
        df_merged
        .groupby('card_hash')['tx_amount']
        .transform(lambda x: x.shift(1).expanding().mean())
    )
    df_merged['card_std_transaction_amount'] = (
        df_merged
        .groupby('card_hash')['tx_amount']
        .transform(lambda x: x.shift(1).expanding().std())
    )

    # Média e Desvio Padrão Diário
    df_merged['card_daily_avg_transaction_amount'] = (
        df_merged
        .groupby(['card_hash','tx_date'])['tx_amount']
        .transform(lambda x: x.shift(1).expanding().mean())
    )
    df_merged['card_daily_transaction_amount_std'] = (
        df_merged
        .groupby(['card_hash','tx_date'])['tx_amount']
        .transform(lambda x: x.shift(1).expanding().std())
    )

    # Média e Desvio Padrão Semanal
    df_merged['card_weekly_avg_transaction_amount'] = (
        df_merged
        .groupby(['card_hash','tx_week_start'])['tx_amount']
        .transform(lambda x: x.shift(1).expanding().mean())
    )
    df_merged['card_weekly_transaction_amount_std'] = (
        df_merged
        .groupby(['card_hash','tx_week_start'])['tx_amount']
        .transform(lambda x: x.shift(1).expanding().std())
    )

    return df_merged

def add_card_time_features(df_merged):
    """
    Adiciona features relacionadas ao tempo das transações do cartão.
    """
    df_merged['tx_datetime'] = pd.to_datetime(df_merged['tx_datetime'])
    df_merged = df_merged.sort_values(['card_hash', 'tx_datetime'])

    df_merged['tx_anterior'] = df_merged.groupby('card_hash')['tx_datetime'].shift(1)
    df_merged['tx_primeira'] = df_merged.groupby('card_hash')['tx_datetime'].transform('min')

    df_merged['_timedelta_last'] = df_merged['tx_datetime'] - df_merged['tx_anterior']
    df_merged['_timedelta_first'] = df_merged['tx_datetime'] - df_merged['tx_primeira']

    df_merged['card_hours_since_last_transaction'] = df_merged['_timedelta_last'].dt.total_seconds() / 3600
    df_merged['card_hours_since_first_transaction'] = df_merged['_timedelta_first'].dt.total_seconds() / 3600
    df_merged['card_days_since_first_transaction'] = df_merged['_timedelta_first'].dt.days

    return df_merged

def add_terminal_frequency_features(df_merged):
    """
    Adiciona features de frequência relacionadas ao terminal.
    """
    df_merged = df_merged.sort_values(['terminal_id', 'tx_datetime'])
    
    # Frequência Diária
    df_merged["terminal_daily_transaction_count"] = (
        df_merged.groupby(["terminal_id", "tx_date"]).cumcount()
    )

    # Frequência Semanal
    df_merged['tx_week_start'] = df_merged['tx_date'] - pd.to_timedelta(df_merged['tx_date'].dt.weekday, unit='d')
    df_merged['terminal_weekly_transaction_count'] = (
        df_merged.groupby(['terminal_id', 'tx_week_start']).cumcount()
    )

    # Frequência por hora
    df_merged['tx_hour'] = df_merged['tx_datetime'].dt.hour
    df_merged['terminal_hourly_transaction_count'] = (
        df_merged.groupby(['terminal_id', 'tx_date', 'tx_hour']).cumcount()
    )

    # Frequência a cada 6 horas
    _6h_period_map = {
        0: '00-06h',
        1: '06-12h',
        2: '12-18h',
        3: '18-24h'
    }
    df_merged['_aux_tx_period_6h_label'] = (df_merged['tx_hour'] // 6).map(_6h_period_map)
    df_merged['terminal_6h_transaction_count'] = (
        df_merged.groupby(['terminal_id', 'tx_date', '_aux_tx_period_6h_label']).cumcount())

    return df_merged

def add_terminal_statistics_features(df_merged):
    """
    Adiciona features estatísticas relacionadas ao terminal.
    """
    df_merged = df_merged.sort_values(['terminal_id', 'tx_datetime'])
    
    df_merged['terminal_avg_daily_transaction_count'] = (
        df_merged.groupby('terminal_id')['terminal_daily_transaction_count']
        .transform(lambda x: x.shift(1).expanding().mean())
    )
    df_merged['terminal_std_daily_transaction_count'] = (
        df_merged.groupby('terminal_id')['terminal_daily_transaction_count']
        .transform(lambda x: x.shift(1).expanding().std())
    )

    df_merged['terminal_avg_weekly_transaction_count'] = (
        df_merged.groupby('terminal_id')['terminal_weekly_transaction_count']
        .transform(lambda x: x.shift(1).expanding().mean())
    )
    df_merged['terminal_std_weekly_transaction_count'] = (
        df_merged.groupby('terminal_id')['terminal_weekly_transaction_count']
        .transform(lambda x: x.shift(1).expanding().std())
    )

    return df_merged

def add_terminal_card_features(df_merged):
    """
    Adiciona features relacionadas aos cartões por terminal.
    """
    df_merged = df_merged.sort_values(['terminal_id', 'tx_datetime'])
    
    # Reset index para evitar problemas com MultiIndex
    df_merged = df_merged.reset_index(drop=True)
    
    def count_unique_cards_before(group):
        unique_cards = set()
        counts = []
        for card_id in group.values:
            counts.append(len(unique_cards))
            unique_cards.add(card_id)
        return counts
    
    # Aplicar a função e converter para Series com índice correto
    daily_counts = []
    for name, group in df_merged.groupby(['terminal_id', 'tx_date']):
        counts = count_unique_cards_before(group['card_id'])
        daily_counts.extend(counts)
    
    df_merged['terminal_daily_distinct_card_count'] = daily_counts
    
    # Contar cartões únicos que transacionaram antes na mesma semana
    weekly_counts = []
    for name, group in df_merged.groupby(['terminal_id', 'tx_week_start']):
        counts = count_unique_cards_before(group['card_id'])
        weekly_counts.extend(counts)
    
    df_merged['terminal_weekly_distinct_card_count'] = weekly_counts

    df_merged['card_terminal_transaction_count'] = (df_merged.groupby(['card_id', 'terminal_id']).cumcount()
    )

    return df_merged

def add_terminal_time_features(df_merged):
    """
    Adiciona features relacionadas ao tempo do terminal.
    """
    df_merged['terminal_operation_start'] = pd.to_datetime(df_merged['terminal_operation_start'])
    df_merged['terminal_seconds_since_first_operation'] = (
        df_merged['tx_date'] - df_merged['terminal_operation_start']
    ).dt.total_seconds()

    return df_merged

def haversine_vec(lat1, lon1, lat2, lon2):
    """
    Calcula distância haversine entre dois vetores de pontos (em km).
    """
    lat1, lon1, lat2, lon2 = map(np.radians, (lat1, lon1, lat2, lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin(dlon/2)**2
    dist = 2 * 6371 * np.arcsin(np.sqrt(a))
    return np.round(dist, 6)

def add_distance_features(df_merged):
    """
    Adiciona features relacionadas à distância.
    """
    df_merged = df_merged.sort_values(['card_id', 'tx_datetime'])
    
    df_merged['first_lat'] = df_merged.groupby('card_id')['latitude'].transform(lambda x: x.iloc[0])
    df_merged['first_lon'] = df_merged.groupby('card_id')['longitude'].transform(lambda x: x.iloc[0])
    
    # Para a primeira transação de cada cartão, a distância é 0
    df_merged['is_first_transaction'] = df_merged.groupby('card_id').cumcount() == 0
    
    df_merged['dist_to_first_km'] = haversine_vec(
        df_merged['latitude'],
        df_merged['longitude'],
        df_merged['first_lat'],
        df_merged['first_lon']
    )
    
    df_merged.loc[df_merged['is_first_transaction'], 'dist_to_first_km'] = 0
    df_merged = df_merged.drop(columns=['is_first_transaction'])

    return df_merged

def add_period_features(df_merged):
    """
    Adiciona features relacionadas ao período do dia.
    """
    periodo_mapping = {
        '00-06h': 'Madrugada',
        '06-12h': 'Dia',
        '12-18h': 'Tarde',
        '18-24h': 'Noite'
    }

    df_merged['period_of_day'] = df_merged['_aux_tx_period_6h_label'].map(periodo_mapping)
    return df_merged

def add_fraud_features(df_merged):
    """
    Adiciona features relacionadas a fraudes usando operações vetorizadas super otimizadas.
    """
    df_merged['tx_datetime'] = pd.to_datetime(df_merged['tx_datetime'])
    df_merged['tx_fraud_report_date'] = pd.to_datetime(df_merged['tx_fraud_report_date'])
    df_merged = df_merged.sort_values(['card_hash', 'tx_datetime'], ignore_index=True)

    # Criar uma coluna indicadora de fraude reportada
    df_merged['has_fraud_report'] = df_merged['tx_fraud_report_date'].notna().astype(int)
    
    # Contar fraudes totais anteriores usando shift e cumsum
    df_merged['card_previous_reported_fraud_count'] = (
        df_merged.groupby('card_hash')['has_fraud_report']
        .transform(lambda x: x.shift(1).fillna(0).cumsum())
        .astype(int)
    )
    
    # Para fraudes transacionais
    df_merged['has_transactional_fraud_report'] = (
        (df_merged['tx_fraud_report_date'].notna()) & 
        (df_merged['is_transactional_fraud'] == 1)
    ).astype(int)
    
    df_merged['card_previous_reported_transactional_fraud_count'] = (
        df_merged.groupby('card_hash')['has_transactional_fraud_report']
        .transform(lambda x: x.shift(1).fillna(0).cumsum())
        .astype(int)
    )
    
    # Para fraudes não-transacionais
    df_merged['has_non_transactional_fraud_report'] = (
        (df_merged['tx_fraud_report_date'].notna()) & 
        (df_merged['is_transactional_fraud'] == 0)
    ).astype(int)
    
    df_merged['card_previous_reported_non_transactional_fraud_count'] = (
        df_merged.groupby('card_hash')['has_non_transactional_fraud_report']
        .transform(lambda x: x.shift(1).fillna(0).cumsum())
        .astype(int)
    )
    
    # Remover colunas auxiliares
    df_merged = df_merged.drop(columns=[
        'has_fraud_report', 
        'has_transactional_fraud_report', 
        'has_non_transactional_fraud_report'
    ])

    return df_merged

def add_card_bin_features(df_merged):
    """
    Adiciona features relacionadas ao BIN do cartão.
    """
    df_merged['card_bin_category'] = df_merged['card_bin'].astype(str)
    return df_merged

def add_city_features(df_merged):
    """
    Adiciona features relacionadas à cidade da transação usando geocodificação reversa.
    Usa reverse_geocoder para processamento em lote mais rápido.
    """
    # Extrair todas as coordenadas únicas
    coords = list(set(zip(df_merged['latitude'], df_merged['longitude'])))

    # Fazer geocodificação reversa em lote (modo 2 = multi-threaded)
    results = rg.search(coords, mode=2)

    # Criar dicionário de mapeamento
    coords_city_map = {
        (coord[0], coord[1]): result['name']
        for coord, result in zip(coords, results)
    }

    # Aplicar o mapeamento ao dataframe
    df_merged['transaction_city'] = df_merged.apply(
        lambda row: coords_city_map.get((row['latitude'], row['longitude']), 'Desconhecida'),
        axis=1
    )

    return df_merged


def remove_auxiliary_columns(df_merged):
    """
    Remove colunas auxiliares do dataframe.
    """
    colunas_auxiliares_para_remover = [
        'tx_week',
        'tx_hour',
        'tx_6h_start',
        'tx_anterior',
        'tx_primeira',
        '_timedelta_since_last',
        '_timedelta_since_first',
        '_timedelta_last',
        '_timedelta_first',
        'tx_week_start',
        'card_hash',
        'terminal_id',
        'transaction_id',
        'card_id',
        '_aux_tx_period_6h_label',
        'first_lat',
        'first_lon',
    ]

    colunas_existentes_para_remover = []
    for col in colunas_auxiliares_para_remover:
        if col in df_merged.columns:
            colunas_existentes_para_remover.append(col)

    if colunas_existentes_para_remover:
        df_merged = df_merged.drop(columns=colunas_existentes_para_remover)

    return df_merged

def process_dataset(df_transactions, df_pays, df_sellers):
    """
    Função principal que processa todo o dataset.
    """
    df_merged = merge_datasets(df_transactions, df_pays, df_sellers)

    df_merged = add_card_frequency_features(df_merged)
    df_merged = add_card_amount_features(df_merged)
    df_merged = add_card_time_features(df_merged)
    df_merged = add_terminal_frequency_features(df_merged)
    df_merged = add_terminal_statistics_features(df_merged)
    df_merged = add_terminal_card_features(df_merged)
    df_merged = add_terminal_time_features(df_merged)
    df_merged = add_distance_features(df_merged)
    df_merged = add_period_features(df_merged)
    df_merged = add_fraud_features(df_merged)
    df_merged = add_card_bin_features(df_merged)
    df_merged = add_city_features(df_merged)

    df_merged = remove_auxiliary_columns(df_merged)

    expected_features = [
        'tx_amount', 'card_bin', 'latitude', 'longitude',
        'card_daily_transaction_count', 'card_weekly_transaction_count',
        'card_hourly_transaction_count', 'card_6h_transaction_count',
        'card_mean_transaction_amount', 'card_std_transaction_amount',
        'card_daily_avg_transaction_amount', 'card_daily_transaction_amount_std',
        'card_weekly_avg_transaction_amount', 'card_weekly_transaction_amount_std',
        'card_hours_since_last_transaction', 'card_hours_since_first_transaction',
        'card_days_since_first_transaction', 'terminal_daily_transaction_count',
        'terminal_weekly_transaction_count', 'terminal_hourly_transaction_count',
        'terminal_6h_transaction_count', 'terminal_avg_daily_transaction_count',
        'terminal_std_daily_transaction_count', 'terminal_avg_weekly_transaction_count',
        'terminal_std_weekly_transaction_count', 'terminal_daily_distinct_card_count',
        'terminal_weekly_distinct_card_count', 'card_terminal_transaction_count',
        'terminal_seconds_since_first_operation', 'dist_to_first_km',
        'period_of_day', 'card_previous_reported_fraud_count',
        'card_previous_reported_transactional_fraud_count',
        'card_previous_reported_non_transactional_fraud_count'
    ]

    for feature in expected_features:
        if feature not in df_merged.columns:
            print(f"Feature {feature} not found in dataframe")
            df_merged[feature] = 0

    df_merged = df_merged[expected_features]

    return df_merged

if __name__ == "__main__":
    df_pays, df_sellers, df_transactions = load_datasets()
    df_result = process_dataset(df_transactions, df_pays, df_sellers)
