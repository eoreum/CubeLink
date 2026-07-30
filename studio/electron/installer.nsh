!macro customInstall
  DetailPrint "CH340/CH341 USB serial driver registration..."
  nsExec::ExecToStack '"$SYSDIR\pnputil.exe" /add-driver "$INSTDIR\resources\drivers\CH341SER\CH341SER.INF" /install'
  Pop $0
  Pop $1
  StrCmp $0 "0" driver_install_done
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "CubeLink Studio 설치는 완료되었지만 CH340 드라이버 설치를 완료하지 못했습니다.$\r$\n학교 PC 관리자에게 CH340 드라이버 설치를 요청해 주세요.$\r$\n오류 코드: $0"
  driver_install_done:
!macroend
