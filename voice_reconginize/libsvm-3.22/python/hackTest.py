# -*- coding: utf8 -*-
import sys
import numpy as np
import librosa
import os
from svmutil import *

if __name__ == '__main__':
    voiceprint_test_path = sys.argv[2]
    print sys.argv[2]
    libsvm_dir = '/Users/mac/Documents/chatbuy-azure/voice_reconginize/libsvm-3.22/python/'
    # To do: integrate input format of user upload file
    y, sr = librosa.load(voiceprint_test_path, sr=44100, mono=True)
    mfcc = librosa.feature.mfcc(y=y, sr=sr)
    mfcc_feature = np.concatenate(
        (mfcc.mean(axis=1), mfcc.std(axis=1)), axis=0)
    # build libsvm test format
    feature = []
    feature_dict = {}
    for idx, val in enumerate(mfcc_feature):
        feature_dict[idx + 1] = val
    feature.append(feature_dict)
    # read training model
    y, x = svm_read_problem(libsvm_dir + sys.argv[1] + '_train')
    m = svm_train(y[:], x[:], '-c 4')
    p_label, p_acc, p_val = svm_predict([1], feature, m)

    print p_label

    # put test data to training dataset
    if p_val[0][0] == 1:
        y.append(1)
    else:
        y.append(-1)
    x.append(feature_dict)

    # train new training model
    with open(libsvm_dir + sys.argv[1] + '_train', "w") as data_file:
        for idx, val in enumerate(y):
            x_dict = x[idx]
            if val > 0:
                data_file.write('+1 ')
            else:
                data_file.write('-1 ')
            for key in x_dict:
                data_file.write(str(key) + ':' + str(x_dict[key]) + ' ')
            data_file.write('\n')
