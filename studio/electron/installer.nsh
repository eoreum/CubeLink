!include "StrFunc.nsh"
!ifndef BUILD_UNINSTALLER
  ${StrStr}
!endif

!macro customInstall
  DetailPrint "CH340/CH341 USB serial driver status check..."

  ; electron-builder uses a 32-bit NSIS bootstrapper. On 64-bit Windows,
  ; Sysnative is required to reach the native System32 pnputil executable.
  StrCpy $0 "$WINDIR\Sysnative\pnputil.exe"
  IfFileExists "$0" pnputil_ready 0
  StrCpy $0 "$SYSDIR\pnputil.exe"
  IfFileExists "$0" pnputil_ready pnputil_missing

  pnputil_ready:
    ; Only connected devices with a Windows PnP problem are returned. A healthy
    ; CH340/CH341 COM port therefore never reaches the driver installation step.
    nsExec::ExecToStack '"$0" /enum-devices /connected /problem /deviceids'
    Pop $1
    Pop $2
    StrCmp $1 "0" check_ch340_7523 driver_check_failed

  check_ch340_7523:
    ${StrStr} $3 $2 "USB\VID_1A86&PID_7523"
    StrCmp $3 "" check_ch341_5523 driver_install_required

  check_ch341_5523:
    ${StrStr} $3 $2 "USB\VID_1A86&PID_5523"
    StrCmp $3 "" check_ch340k_7522 driver_install_required

  check_ch340k_7522:
    ${StrStr} $3 $2 "USB\VID_1A86&PID_7522"
    StrCmp $3 "" check_ch330_e523 driver_install_required

  check_ch330_e523:
    ${StrStr} $3 $2 "USB\VID_1A86&PID_E523"
    StrCmp $3 "" check_legacy_ch341_5523 driver_install_required

  check_legacy_ch341_5523:
    ${StrStr} $3 $2 "USB\VID_4348&PID_5523"
    StrCmp $3 "" driver_not_needed driver_install_required

  driver_not_needed:
    DetailPrint "No connected CH340/CH341 device with a driver problem; bundled driver skipped."
    Goto driver_install_done

  driver_install_required:
    DetailPrint "CH340/CH341 device with a driver problem detected; installing bundled driver..."
    nsExec::ExecToStack '"$0" /add-driver "$INSTDIR\resources\drivers\CH341SER\CH341SER.INF" /install'
    Pop $1
    Pop $2
    StrCmp $1 "0" driver_install_succeeded
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "CubeLink Studio 설치는 완료되었지만 연결된 CH340/CH341 장치의 드라이버를 설치하지 못했습니다.$\r$\n장치를 다시 연결한 뒤 학교 PC 관리자에게 드라이버 설치를 요청해 주세요.$\r$\n오류 코드: $1"
    Goto driver_install_done

  driver_install_succeeded:
    DetailPrint "CH340/CH341 USB serial driver installed successfully."
    Goto driver_install_done

  driver_check_failed:
    DetailPrint "PnP driver-status check failed (code $1); bundled driver was not installed automatically."
    Goto driver_install_done

  pnputil_missing:
    DetailPrint "pnputil.exe was not found; bundled driver was not installed automatically."

  driver_install_done:
!macroend
