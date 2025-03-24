# -*- coding: utf-8 -*-
import sys
import time
from AiModuleProcess import AiModuleProcess


# AI �� ��뿹.
try :
    ai = AiModuleProcess();
    # ai.DoSendDataPpt("C# ���α׷���", r"C:\Users\skyma\Downloads\Win32API.pptx")
    # ai.DoSendDataWav("C# ���α׷���", r"C:\Users\skyma\Downloads\0ee369ae-e4df-4f8e-907f-a4977376fc78.wav")
    # ai.ExecuteDebugCode();
    # ai.ExecuteTestQandA

    # ai.DoLectureCreate("�ڻ����� �ɷη���")
    # ai.DoSendDataTxt("�ڻ����� �ɷη���", r"S:\[GitHub]\240102_OpenAI_API\�� �ؽ�Ʈ ����.txt")
    # time.sleep(1.)
    # ai.DoFineTuneCreate("�ڻ����� �ɷη���")

    # ai.DoGetAnswer("112", "C# ���α׷���", r"�����̵忡�� ȸ�� ������ ����,  �˻�, ����, �����ϴ� ���α׷��� ��ɰ� ���õ� ������ ���ԵǾ� �ֽ��ϴ�. ȸ�� ������ �������� �̷��� �ֳ���?")
    ai.ExecuteTestQandA("C# ���α׷���");
    sys.exit()

except Exception as ex : 
    print(ex + ex.with_stacktrace().format_exc())
