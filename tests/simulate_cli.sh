#!/bin/bash
URL="https://script.google.com/macros/s/AKfycbygChHKd7LZFm5SmITHk9FVi_JuN0no9bk36mKdhdtYl5huuW_Mqs9YFR4qqmiSnr9Q/exec"

echo "Mengubah file ke Base64..."
BASE64_DATA=$(base64 < /home/k/GAS/library/tests/test_upload.txt | tr -d '\n')
DATA_URI="data:text/plain;base64,${BASE64_DATA}"

echo "1. Simulasi Upload File..."
curl -L -X POST \
  -H "Content-Type: text/plain" \
  -d "{\"action\": \"upload\", \"data\": {\"base64\": \"${DATA_URI}\", \"fileName\": \"/home/k/GAS/library/tests/test_upload.txt\", \"mimeType\": \"text/plain\"}}" \
  $URL

echo -e "\n\n2. Simulasi List File..."
curl -L -X GET "${URL}?action=list"

# echo -e "\n\n[INFO] Untuk Test Hapus (Delete), ganti action di script menjadi delete dan berikan fileId"
# Contoh Delete:
# curl -L -X POST \
#   -H "Content-Type: text/plain" \
#   -d "{\"action\": \"delete\", \"data\": {\"fileId\": \"MASUKAN_FILE_ID\"}}" \
#   $URL

