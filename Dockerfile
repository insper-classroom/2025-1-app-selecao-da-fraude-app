FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    git gcc curl unzip \
    && apt-get clean

# Instala awscli
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws

# Instala dvc com suporte a S3
RUN pip install --upgrade pip && pip install dvc[s3]

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

EXPOSE 8083

# Usa envs no container (em tempo de execução)
CMD bash -c "aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID && \
             aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY && \
             dvc pull && \
             cd backend && \
             python main.py"
