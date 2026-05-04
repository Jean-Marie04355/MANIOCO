@echo off
echo Lancement de Mailpit (Serveur Email) sur le port SMTP 1026...
set MP_SMTP_BIND_ADDR=0.0.0.0:1026
mailpit-win\mailpit.exe
pause
