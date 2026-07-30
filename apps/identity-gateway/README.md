# Synthetic identity gateway — Phase 3

The local Express gateway is backed by 200 synthetic NIN records. It exposes `/verify`, `/records/:nin/status`, and `/health`. It never connects to NIMC or logs complete NIN values.
