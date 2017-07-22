import numpy as np
import librosa
from scipy.fftpack import fft, ifft
import os,sys

def nextpow2(n):
    m_f = np.log2(n)
    m_i = np.ceil(m_f)
    return 2**m_i

def stft(x,win,stp):
	stp = int(stp)
	t = len(x)
	N = len(win)
	m = int(np.ceil(float(N-stp+t)/stp))
	x = np.array(x).reshape((x.shape[0],1))
	x = np.concatenate((np.zeros((N-stp,1)),x,np.zeros((m*stp-t,1))),axis=0)
	X = np.zeros((N,m),dtype=np.complex_)
	for j in range(m):
		X[:,j] = fft(np.multiply(x[stp*j:stp*j+N,0],win),axis=0)
	return X

def istft(X,win,stp):
	stp = int(stp)
	N = X.shape[0]
	m = X.shape[1]
	l = (m-1)*stp+N
	x = np.zeros((l,1))

	# To do: why ifft is wrong?
	'''
	j = 0
	ift = np.real(ifft(X[:,j]))
	print X[:,j]
	print X[2047,j]
	print X[:,j].shape
	#for i in range(X[:,j].shape[0]):
		#print X[i,j]
	print X[0:4,j]
	print ifft(X[0:2048,j])

	'''
	for j in range(m):
		ift = np.real(ifft(X[:,j]))
		x[stp*j:stp*j+N] = x[stp*j:stp*j+N] + ift.reshape(ift.shape[0],1)
	# To change here -- about done
	x1 = x[0:l-(N-stp)]
	x2 = x[l:x.shape[0]]
	x = np.concatenate([x1,x2])
	x = x[(N-stp):x.shape[0]]
	x = np.true_divide(x,sum(win[0:N:stp]))
	return x

def acorr(X):
	n = X.shape[0]
	m = X.shape[1]
	X = np.concatenate((X,np.zeros((n,m))),axis=0)
	X = np.abs(fft(X,axis=0))**2
	C = np.real(ifft(X,axis=0))
	C = C[0:n,:]
	tr = np.arange(n,0,-1).reshape(n,1)
	tt = np.tile(tr,(1,m))
	C = np.true_divide(C,np.tile(tr,(1,m)))
	return C

def beat_spectrum(X):
	B = acorr(X.transpose())
	b = np.mean(B,axis=1)
	return b

def repeating_period(b,r):
	b = b[1:b.shape[0]]
	b = b[int(r[0])-1:int(r[1])]
	p = np.argmax(b)
	p = p+r[0]+1
	return p

def repeating_mask(V,p):
	n = V.shape[0]
	m = V.shape[1]
	p = int(p)
	r = int(np.ceil(float(m)/p))

	W = np.concatenate((V,np.NaN*np.ones((n,r*p-m))),axis=1)
	W = W.reshape(n*p,r,order='F')
	W = np.concatenate((np.median(W[0:n*(m-(r-1)*p)][:,0:r],axis=1),np.median(W[n*(m-(r-1)*p):n*p][:,0:r-1],axis=1)),axis=0)
	W = np.reshape(np.tile(W,(1,r)),(n,r*p),order='F')

	W = W[:,0:m]
	W = np.minimum(V,W)
	M = np.true_divide(W+np.spacing(1),V+np.spacing(1))
	return M

def repet(x,fs):
	per = np.array([0.8,min(8,(len(x)/fs)/3)])
	length = 0.040
	N = nextpow2(length*fs)
	win = np.hamming(N)
	stp = N/2
	cof = 100
	cof = int(np.ceil(float(cof)*(N-1)/fs))
	t = x.shape[0]
	k = x.shape[1]

	X = []
	for i in range(k):
		Xi = stft(x[:,i],win,stp)
		if i==0:
			X = Xi
		else:
			X = np.concatenate((X,Xi),axis=0)
	X = X.reshape(X.shape[0]/k,X.shape[1],k)
	V = np.abs(X[0:int(N/2)+1,:,:])

	per = np.ceil((per*fs+N/stp-1)/stp)
	if per.size == 1:
		p = per
	elif per.size == 2:
		b = beat_spectrum(np.mean(V**2,2))
		p = repeating_period(b,per)

	# p is less than one compared to matlab ex: python: p=329, matlab p=330
	'''
	i = 0
	Mi = repeating_mask(V[:,:,i],p)
	Mi[1:cof+1,:] = 1
	Mi = np.concatenate((Mi,np.flipud(Mi[1:-1,:])),axis=0)
	yi = istft(Mi*X[:,:,i],win,stp)

	'''
	y = np.zeros((t,k))
	for i in range(k):
		Mi = repeating_mask(V[:,:,i],p)
		Mi[1:cof+1,:] = 1
		Mi = np.concatenate((Mi,np.flipud(Mi[1:-1,:])),axis=0)
		yi = istft(Mi*X[:,:,i],win,stp)
		yt = yi[0:t]
		y[:,i] = yt.reshape(yt.shape[0])
	return y
	


if __name__ == '__main__':
	# To do: how to load two channel audio? and how to use mfcc
	#for singer in os.listdir('/Users/chienyi/MIRMusic'):
	#for song in os.listdir('/Users/chienyi/MIRMusic/'+singer):
	'''
	features = []
	n=0
	for singer in os.listdir('/Users/chienyi/MIRMusic'):
		if singer[0]!='.':
			for song in os.listdir('/Users/chienyi/MIRMusic/'+singer):
				y,sr = librosa.load('/Users/chienyi/MIRMusic/'+singer+'/'+song,sr=44100,mono=True)
				if len(y.shape)==1:
					y = y.reshape(y.shape[0],1)
				else:
					y = y.transpose()
				y = repet(y,sr)
				y = y.reshape(y.shape[0])
				# To do : modulate mfcc as matlab mfcc(rank=13,20?)
				mfcc = librosa.feature.mfcc(y=y,sr=sr)
				mfcc_feature = np.concatenate((mfcc.mean(axis=1),mfcc.std(axis=1)),axis=0)
				mfcc_feature = mfcc_feature.reshape(1,mfcc_feature.shape[0])
				if n==0:
					features = mfcc_feature
					n = 1
				else:
					features = np.concatenate((features,mfcc_feature),axis=0)
				print mfcc_feature
				
	np.savetxt('features.csv',features,delimiter=',')
	'''

	y,sr = librosa.load('/Users/chienyi/MIRMusic/JJLin/JJLin1.mp3',sr=44100,mono=True)
	if len(y.shape)==1:
		y = y.reshape(y.shape[0],1)
	else:
		y = y.transpose()
		y = repet(y,sr)
	y = y.reshape(y.shape[0])
	# To do : modulate mfcc as matlab mfcc(rank=13,20?)
	mfcc = librosa.feature.mfcc(y=y,sr=sr)
	mfcc_feature = np.concatenate((mfcc.mean(axis=1),mfcc.std(axis=1)),axis=0)
	for i in range(len(mfcc_feature)):
		sys.stdout.write(str(mfcc_feature[i])+',')
		#sys.stdout.write(str(i+1)+'='+str(mfcc_feature[i])+' ')

