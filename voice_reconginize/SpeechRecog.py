import speech_recognition,sys

speech_file_path = sys.argv[1]

r = speech_recognition.Recognizer()
with speech_recognition.AudioFile(speech_file_path) as source:
    audio = r.listen(source)
    print r.recognize_google(audio, language='zh-TW')