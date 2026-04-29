#!/bin/bash

# tests/simulate_cli.sh
# Skrip ini menyimulasikan panggilan request ke endpoint yang dibuat
# (Asumsikan URL endpoint GAS kita adalah https://script.google.com/macros/s/xxxx/exec)

URL="<URL_DEPLOYMENT_GAS>"

echo "Mempersiapkan file test_upload.txt..."
echo "Halo, ini file percobaan upload dari CLI" > test_upload.txt

echo "Mengubah file ke Base64..."
BASE64_DATA=$(base64 < test_upload.txt | tr -d '\n')
# Data URI format untuk plain text
DATA_URI="data:text/plain;base64,${BASE64_DATA}"

echo "1. Simulasi Upload File..."
curl -L -X POST \
  -H "Content-Type: text/plain" \
  -d "{\"action\": \"upload\", \"data\": {\"base64\": \"${DATA_URI}\", \"fileName\": \"test_upload.txt\", \"mimeType\": \"text/plain\"}}" \
  $URL

echo -e "\n\n2. Simulasi List File..."
# List File biasanya menggunakan GET params: ?action=list
curl -L -X GET "${URL}?action=list"

echo -e "\n\n[INFO] Untuk Test Hapus (Delete), ganti action di script menjadi delete dan berikan fileId"
# Contoh Delete:
# curl -L -X POST \
#   -H "Content-Type: text/plain" \
#   -d "{\"action\": \"delete\", \"data\": {\"fileId\": \"MASUKAN_FILE_ID\"}}" \
#   $URL

rm test_upload.txt
echo -e "\n\nSelesai."
