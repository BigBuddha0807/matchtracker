MATCHTRACKER – VERSION MIT ANMELDUNG UND MFA
===========================================

Enthalten:
- Bestehende Spieloberfläche (Timer, Tore, Wechsel, Kader, Berichte, Saisonstatistik)
- Supabase-Anmeldung und Registrierung
- E-Mail-Bestätigung / Registrierungsanfrage
- TOTP-MFA-Einrichtung und MFA-Abfrage vor dem Vereinszugriff
- Mannschaftsauswahl anhand der zugewiesenen Rechte
- Adminbereich für Registrierungsfreigabe und Mannschaftszuordnung
- Einladungsaufruf über die Supabase Edge Function invite-user
- Lokale Offline-Speicherung pro angemeldetem Benutzer und Mannschaft

WICHTIGE EINSCHRÄNKUNG DIESER AUSBAUSTUFE:
Die Spielstände werden weiterhin lokal im Browser gespeichert. Eine geräteübergreifende Cloud-Synchronisierung der Spiele, Spieler und Ereignisse ist noch nicht enthalten. Die Anmeldung und Berechtigungsprüfung greifen bereits auf Supabase zu. Bitte diese Version zunächst als Teststand behandeln, nicht als produktive Vereinsdatenbank für echte Kinderdaten.

VORAUSSETZUNGEN:
1. Das neue SQL-Erstinstallationsskript wurde im Supabase-Projekt erfolgreich ausgeführt.
2. Supabase Auth: E-Mail-Bestätigung aktivieren; Redirect-URL der veröffentlichten App in Authentication > URL Configuration eintragen.
3. Authentication > Multi-Factor Authentication: TOTP aktivieren/zulassen. Der Datenbankzugriff erfordert aal2.
4. Deploye die Edge Function invite-user aus dem Backend-Paket und setze dort APP_URL auf die veröffentlichte PWA-URL. SUPABASE_SERVICE_ROLE_KEY nur als Edge-Function-Secret setzen, niemals in die PWA.
5. Publishable/anon Key im Frontend ist ein öffentlicher Client-Key; niemals service_role verwenden.

DEPLOYMENT:
Den Inhalt dieses Ordners in das bestehende GitHub-Pages-Repository übernehmen und veröffentlichen. Danach die App einmal online öffnen, damit Service Worker und Dateien aktualisiert werden.

WICHTIG ZU BESTEHENDEN LOKALEN DATEN:
Beim ersten Login werden vorhandene Daten aus dem alten lokalen Schlüssel 'matchtracker' in den persönlichen lokalen Speicher der zuerst ausgewählten Mannschaft kopiert. Die Originaldaten bleiben als lokale Kopie erhalten. Bei mehreren Mannschaften wird nicht automatisch auf andere Mannschaften verteilt.

SICHERHEIT:
- Der Browser-Key ist nur der Supabase Publishable Key.
- Kein Service-Role-Key in HTML/JavaScript.
- MFA ist erforderlich, bevor Mannschafts-/Spielerdaten aus Supabase gelesen werden.
- Vor einem produktiven Einsatz müssen Cloud-Synchronisierung, Backup-/Restore-Strategie, Datenschutzinformationen und Ende-zu-Ende-Tests ergänzt werden.
