# -*- coding: utf8 -*-
import sys
import numpy as np
import librosa
import os
from svmutil import *

if __name__ == '__main__':
    voiceprint_train_dir = '/Users/mac/Documents/chatbuy-azure/voice_reconginize/train_data/'
    libsvm_dir = '/Users/mac/Documents/chatbuy-azure/voice_reconginize/libsvm-3.22/python/'
    # open new training file
    f = open(libsvm_dir + sys.argv[1] + '_train', "w")
    f.close()
    # train voiceprint system
    for file in [f for f in os.listdir(voiceprint_train_dir)]:
        if file.endswith('.mp3'):
            y, sr = librosa.load(voiceprint_train_dir +
                                 file, sr=44100, mono=True)
            mfcc = librosa.feature.mfcc(y=y, sr=sr)
            mfcc_feature = np.concatenate(
                (mfcc.mean(axis=1), mfcc.std(axis=1)), axis=0)
            svm_feature = ''
            basename = os.path.basename(file)
            # assume training file end with XX.mp3
            if basename[:-6] == sys.argv[1]:
                svm_feature += '+1 '
            else:
                svm_feature += '-1 '
            # LIBSVM reading format
            for idx, val in enumerate(mfcc_feature):
                svm_feature += str(idx + 1) + ':' + str(val) + ' '
            svm_feature += '\n'
            # write to train file
            with open(libsvm_dir + sys.argv[1] + '_train', "a") as data_file:
                data_file.write(svm_feature)
                data_file.close()
    # training svm model with input feature vector data
    y, x = svm_read_problem(libsvm_dir + sys.argv[1] + '_train')
    m = svm_train(y[:], x[:], '-c 4')
    # p_label, p_acc, p_val = svm_predict(y[0:1], x[0:1], m)
    # p_label is the predicted label, p_acc is the accuracy given y, p_val is the probaility of the predicted label
    # print 'p_val:'+str(p_val[0][0])
